import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock, type SupabaseMockHandle } from "@/test/supabase-mock";
import { currentWeekStart, todayInIstanbul } from "@/lib/week";

const mocks = vi.hoisted(() => ({
  adminHandle: null as unknown as SupabaseMockHandle,
  serverHandle: null as unknown as SupabaseMockHandle,
  assertStudentAction: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ assertStudentAction: mocks.assertStudentAction }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mocks.adminHandle.client,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => mocks.serverHandle.client,
}));
vi.mock("@/lib/notifications", () => ({
  getParentIdsByStudent: vi.fn(),
  notifyUsers: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import {
  completeOwnScheduleEntry,
  createOwnScheduleEntry,
  deleteOwnScheduleEntry,
  setOwnScheduleAutoRepeat,
  undoOwnScheduleCompletion,
  updateOwnScheduleEntry,
} from "@/lib/actions/schedule";

beforeEach(() => {
  mocks.assertStudentAction.mockReset();
  mocks.assertStudentAction.mockResolvedValue({ id: "student-1", role: "student" });
  mocks.revalidatePath.mockClear();
  mocks.serverHandle = createSupabaseMock();
});

describe("undoOwnScheduleCompletion", () => {
  it("kimliği doğrulanmış öğrencinin kaydını dar RPC ile geri alır", async () => {
    mocks.serverHandle = createSupabaseMock({
      rpcResults: { undo_own_schedule_completion: [{}] },
    });
    const formData = new FormData();
    formData.set("id", "entry-1");
    await undoOwnScheduleCompletion(formData);
    expect(mocks.serverHandle.rpcCalls).toEqual([
      { name: "undo_own_schedule_completion", args: { p_entry_id: "entry-1" } },
    ]);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/student/gunluk/dokum");
  });

  it("ikinci geri alma veya gün/sahiplik hatasını kullanıcıya taşır", async () => {
    mocks.serverHandle = createSupabaseMock({
      rpcResults: {
        undo_own_schedule_completion: [
          {
            error: {
              message: "Bu çalışma tamamlanmış değil veya daha önce geri alındı.",
            },
          },
        ],
      },
    });
    const formData = new FormData();
    formData.set("id", "entry-1");
    await expect(undoOwnScheduleCompletion(formData)).rejects.toThrow(
      "daha önce geri alındı",
    );
  });
});

describe("setOwnScheduleAutoRepeat", () => {
  it("yalnız doğrulanmış öğrencinin kendi ayarını günceller", async () => {
    mocks.adminHandle = createSupabaseMock({
      results: { student_profiles: [{ data: [{ id: "student-1" }] }] },
    });

    await setOwnScheduleAutoRepeat(true);

    const update = mocks.adminHandle.queries.find(
      (query) => query.table === "student_profiles",
    );
    expect(update?.op).toBe("update");
    expect(update?.values).toEqual({ schedule_auto_repeat: true });
    expect(update?.filters).toContainEqual(["eq", "id", "student-1"]);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/student/profile");
  });

  it("öğrenci yetkisi yoksa service-role sorgusu çalıştırmaz", async () => {
    mocks.assertStudentAction.mockRejectedValue(new Error("Yetkisiz."));
    mocks.adminHandle = createSupabaseMock();

    await expect(setOwnScheduleAutoRepeat(false)).rejects.toThrow("Yetkisiz.");
    expect(mocks.adminHandle.queries).toHaveLength(0);
  });
});

describe("createOwnScheduleEntry", () => {
  it("yalnız doğrulanmış öğrencinin kendi programına kayıt ekler", async () => {
    mocks.adminHandle = createSupabaseMock({
      results: {
        student_profiles: [{ data: { grade_level: 8 } }],
        study_schedule_entries: [{ data: [{ id: "entry-1" }] }],
      },
    });
    const formData = new FormData();
    formData.set("day_of_week", "2");
    formData.set("start_time", "14:00");
    formData.set("end_time", "15:00");
    formData.set("subject", "Matematik");
    formData.set("kazanim_code", "M8-01");
    formData.set("week_start", currentWeekStart());

    await createOwnScheduleEntry(formData);

    const insert = mocks.adminHandle.queries.find(
      (query) => query.table === "study_schedule_entries",
    );
    expect(insert?.op).toBe("insert");
    expect(insert?.values).toEqual({
      student_id: "student-1",
      day_of_week: 2,
      start_time: "14:00",
      end_time: "15:00",
      activity_label: "Matematik — Çarpanlar ve Katlar",
      subject: "Matematik",
      kazanim_code: "M8-01",
      kazanim_name: "Çarpanlar ve Katlar",
      week_start: currentWeekStart(),
      updated_by: "student-1",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/student/schedule");
  });

  it("öğrenci yetkisi yoksa program kaydı oluşturmaz", async () => {
    mocks.assertStudentAction.mockRejectedValue(new Error("Yetkisiz."));
    mocks.adminHandle = createSupabaseMock();

    await expect(createOwnScheduleEntry(new FormData())).rejects.toThrow("Yetkisiz.");
    expect(mocks.adminHandle.queries).toHaveLength(0);
  });

  it("öğrenci kendi kaydını düzenlerken sahiplik filtresi taşır", async () => {
    mocks.adminHandle = createSupabaseMock({
      results: {
        study_schedule_entries: [
          {
            data: {
              id: "entry-1",
              week_start: currentWeekStart(),
              completion_log_id: null,
            },
          },
          {},
        ],
        student_profiles: [{ data: { grade_level: 8 } }],
      },
    });
    const formData = new FormData();
    formData.set("id", "entry-1");
    formData.set("day_of_week", "1");
    formData.set("start_time", "10:00");
    formData.set("end_time", "11:00");
    formData.set("subject", "Matematik");
    formData.set("kazanim_code", "M8-02");
    formData.set("week_start", currentWeekStart());

    await updateOwnScheduleEntry(formData);

    const updates = mocks.adminHandle.queries.filter(
      (query) => query.table === "study_schedule_entries" && query.op === "update",
    );
    expect(updates).toHaveLength(1);
    expect(updates[0]?.filters).toContainEqual(["eq", "student_id", "student-1"]);
    expect(updates[0]?.values).toMatchObject({
      subject: "Matematik",
      kazanim_code: "M8-02",
      kazanim_name: "Üslü İfadeler",
      updated_by: "student-1",
    });
  });

  it("öğrenci yalnız kendi kaydını siler", async () => {
    mocks.adminHandle = createSupabaseMock({
      results: {
        study_schedule_entries: [
          { data: { id: "entry-1", week_start: currentWeekStart() } },
          {},
        ],
      },
    });
    const formData = new FormData();
    formData.set("id", "entry-1");

    await deleteOwnScheduleEntry(formData);

    const deletion = mocks.adminHandle.queries.find(
      (query) => query.table === "study_schedule_entries" && query.op === "delete",
    );
    expect(deletion?.filters).toContainEqual(["eq", "id", "entry-1"]);
    expect(deletion?.filters).toContainEqual(["eq", "student_id", "student-1"]);
  });

  it("tamamlanan programı günlüğe yazar ve kayıtla ilişkilendirir", async () => {
    mocks.adminHandle = createSupabaseMock({
      results: {
        study_schedule_entries: [
          {
            data: {
              id: "entry-1",
              week_start: currentWeekStart(),
              start_time: "14:00",
              end_time: "15:00",
              subject: "Matematik",
              kazanim_name: "Çarpanlar ve Katlar",
              completed_at: null,
            },
          },
          {},
        ],
        study_log: [{ data: { id: "log-1" } }],
      },
    });
    const formData = new FormData();
    formData.set("id", "entry-1");
    formData.set("question_count", "18.6");

    await completeOwnScheduleEntry(formData);

    const log = mocks.adminHandle.queries.find((query) => query.table === "study_log");
    expect(log?.op).toBe("insert");
    expect(log?.values).toMatchObject({
      student_id: "student-1",
      log_date: todayInIstanbul(),
      subject: "Matematik",
      topic: "Çarpanlar ve Katlar",
      minutes: 60,
      question_count: 19,
      marked_by: "student-1",
    });
    const completion = mocks.adminHandle.queries.find(
      (query) => query.table === "study_schedule_entries" && query.op === "update",
    );
    expect(completion?.values).toMatchObject({
      completion_log_id: "log-1",
      updated_by: "student-1",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/student/gunluk/dokum");
  });
});
