import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock, type SupabaseMockHandle } from "@/test/supabase-mock";

const mocks = vi.hoisted(() => ({
  handle: null as unknown as SupabaseMockHandle,
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => mocks.handle.client,
}));
vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
  updateTag: vi.fn(),
}));

import { addStudyLog, deleteStudyLog } from "@/lib/actions/study-log";

function form(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

const student = { id: "student-1" };
const studentProfile = { data: { role: "student" } };

beforeEach(() => {
  mocks.revalidatePath.mockReset();
});

describe("addStudyLog", () => {
  it("oturum yoksa hiç sorgu atmadan fırlatır", async () => {
    mocks.handle = createSupabaseMock({ user: null });
    await expect(addStudyLog(form({ subject: "Matematik", minutes: "30" }))).rejects.toThrow(
      "Yetkisiz.",
    );
    expect(mocks.handle.queries).toHaveLength(0);
  });

  it("öğrenci olmayan rol reddedilir", async () => {
    mocks.handle = createSupabaseMock({
      user: student,
      results: { profiles: [{ data: { role: "parent" } }] },
    });
    await expect(addStudyLog(form({ subject: "Matematik", minutes: "30" }))).rejects.toThrow(
      "Çalışma kaydını yalnızca öğrenci ekleyebilir.",
    );
  });

  it("ders seçilmediyse fırlatır", async () => {
    mocks.handle = createSupabaseMock({
      user: student,
      results: { profiles: [studentProfile] },
    });
    await expect(addStudyLog(form({ minutes: "30" }))).rejects.toThrow("Ders seçilmeli.");
  });

  it.each(["0", "1441", "abc"])("geçersiz süre %s reddedilir", async (minutes) => {
    mocks.handle = createSupabaseMock({
      user: student,
      results: { profiles: [studentProfile] },
    });
    await expect(addStudyLog(form({ subject: "Fen", minutes }))).rejects.toThrow(
      "Süre 1-1440 dakika arasında olmalı.",
    );
  });

  it("soru sayısı sınır dışıysa reddedilir", async () => {
    mocks.handle = createSupabaseMock({
      user: student,
      results: { profiles: [studentProfile] },
    });
    await expect(
      addStudyLog(form({ subject: "Fen", minutes: "30", question_count: "2001" })),
    ).rejects.toThrow("Soru sayısı 0-2000 arasında olmalı.");
  });

  it("happy path: kayıt kendi adına yazılır, yollar tazelenir", async () => {
    mocks.handle = createSupabaseMock({
      user: student,
      results: { profiles: [studentProfile] },
    });
    await addStudyLog(
      form({
        subject: "Matematik",
        topic: "Kesirler",
        minutes: "45.6",
        question_count: "19.7",
        log_date: "2026-07-15",
      }),
    );

    const insert = mocks.handle.queries.find((q) => q.table === "study_log");
    expect(insert?.op).toBe("insert");
    expect(insert?.values).toMatchObject({
      student_id: "student-1",
      marked_by: "student-1",
      subject: "Matematik",
      topic: "Kesirler",
      minutes: 46,
      question_count: 20,
      log_date: "2026-07-15",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/student");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/student/gunluk");
  });

  it("geçersiz tarih bugüne düşer", async () => {
    mocks.handle = createSupabaseMock({
      user: student,
      results: { profiles: [studentProfile] },
    });
    await addStudyLog(form({ subject: "Fen", minutes: "30", log_date: "15/07/2026" }));
    const insert = mocks.handle.queries.find((q) => q.table === "study_log");
    expect((insert?.values as { log_date: string }).log_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("veritabanı hatası mesajıyla iletilir", async () => {
    mocks.handle = createSupabaseMock({
      user: student,
      results: {
        profiles: [studentProfile],
        study_log: [{ error: { message: "insert kilitli" } }],
      },
    });
    await expect(addStudyLog(form({ subject: "Fen", minutes: "30" }))).rejects.toThrow(
      "insert kilitli",
    );
  });
});

describe("deleteStudyLog", () => {
  it("oturum yoksa fırlatır", async () => {
    mocks.handle = createSupabaseMock({ user: null });
    await expect(deleteStudyLog(form({ id: "log-1" }))).rejects.toThrow("Yetkisiz.");
    expect(mocks.handle.queries).toHaveLength(0);
  });

  it("silme sorgusu hem id hem sahiplik filtresi taşır", async () => {
    mocks.handle = createSupabaseMock({
      user: student,
      results: { study_log: [{ data: [{ id: "log-1" }] }] },
    });
    await deleteStudyLog(form({ id: "log-1" }));

    const del = mocks.handle.queries.find((q) => q.table === "study_log");
    expect(del?.op).toBe("delete");
    expect(del?.filters).toContainEqual(["eq", "id", "log-1"]);
    expect(del?.filters).toContainEqual(["eq", "student_id", "student-1"]);
  });

  it("silinen satır dönmezse açık hata verir", async () => {
    mocks.handle = createSupabaseMock({
      user: student,
      results: { study_log: [{ data: [] }] },
    });
    await expect(deleteStudyLog(form({ id: "baskasinin" }))).rejects.toThrow(
      "Kayıt bulunamadı veya silme yetkin yok.",
    );
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
