import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock, type SupabaseMockHandle } from "@/test/supabase-mock";
import { currentWeekStart } from "@/lib/week";

const mocks = vi.hoisted(() => ({
  adminHandle: null as unknown as SupabaseMockHandle,
  assertStudentAction: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ assertStudentAction: mocks.assertStudentAction }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mocks.adminHandle.client,
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/notifications", () => ({
  getParentIdsByStudent: vi.fn(),
  notifyUsers: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import { createOwnScheduleEntry, setOwnScheduleAutoRepeat } from "@/lib/actions/schedule";

beforeEach(() => {
  mocks.assertStudentAction.mockReset();
  mocks.assertStudentAction.mockResolvedValue({ id: "student-1", role: "student" });
  mocks.revalidatePath.mockClear();
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
      results: { study_schedule_entries: [{ data: [{ id: "entry-1" }] }] },
    });
    const formData = new FormData();
    formData.set("day_of_week", "2");
    formData.set("start_time", "14:00");
    formData.set("end_time", "15:00");
    formData.set("activity_label", "Matematik - Kesirler");
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
      activity_label: "Matematik - Kesirler",
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
});
