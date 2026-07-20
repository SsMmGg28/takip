import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock, type SupabaseMockHandle } from "@/test/supabase-mock";

const mocks = vi.hoisted(() => ({
  handle: null as unknown as SupabaseMockHandle,
  assertTeacherAction: vi.fn(),
  notifyUsers: vi.fn(async () => {}),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => mocks.handle.client,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));
vi.mock("@/lib/auth", () => ({ assertTeacherAction: mocks.assertTeacherAction }));
vi.mock("@/lib/notifications", () => ({
  notifyUsers: mocks.notifyUsers,
  getParentIdsByStudent: vi.fn(async () => new Map()),
}));

import { createHomework } from "@/app/teacher/homework/actions";

function baseForm(overrides: { students?: string[]; title?: string } = {}) {
  const fd = new FormData();
  fd.set("title", overrides.title ?? "Kesirler föyü");
  for (const id of overrides.students ?? ["s1", "s2"]) fd.append("student_ids", id);
  return fd;
}

const insertedRows = { data: [{ id: "hw-1" }, { id: "hw-2" }] };

beforeEach(() => {
  mocks.assertTeacherAction.mockReset();
  mocks.assertTeacherAction.mockResolvedValue({ id: "teacher-1", role: "teacher" });
  mocks.notifyUsers.mockClear();
});

describe("createHomework", () => {
  it("öğretmen guard'ı ilk sırada: reddedilirse hiç sorgu atılmaz", async () => {
    mocks.assertTeacherAction.mockRejectedValue(
      new Error("Bu işlemi yalnızca öğretmen yapabilir."),
    );
    mocks.handle = createSupabaseMock();
    await expect(createHomework(baseForm())).rejects.toThrow(
      "Bu işlemi yalnızca öğretmen yapabilir.",
    );
    expect(mocks.handle.queries).toHaveLength(0);
  });

  it("başlık yoksa fırlatır", async () => {
    mocks.handle = createSupabaseMock({ user: { id: "teacher-1" } });
    await expect(createHomework(baseForm({ title: "" }))).rejects.toThrow("Başlık gerekli.");
  });

  it("öğrenci seçilmediyse fırlatır", async () => {
    mocks.handle = createSupabaseMock({ user: { id: "teacher-1" } });
    await expect(createHomework(baseForm({ students: [] }))).rejects.toThrow(
      "En az bir öğrenci seç.",
    );
  });

  it("geçersiz dosya türü insert'ten ÖNCE gerçek doğrulama mesajıyla reddedilir", async () => {
    mocks.handle = createSupabaseMock({ user: { id: "teacher-1" } });
    const fd = baseForm();
    fd.set("attachment", new File(["x"], "virus.exe", { type: "application/x-msdownload" }));
    await expect(createHomework(fd)).rejects.toThrow(/Desteklenmeyen dosya türü/);
    expect(mocks.handle.queries).toHaveLength(0);
  });

  it("happy path: öğrenci başına satır, ortak grup kimliği, created_by öğretmen", async () => {
    mocks.handle = createSupabaseMock({
      user: { id: "teacher-1" },
      results: { homework: [insertedRows] },
    });
    await createHomework(baseForm());

    const insert = mocks.handle.queries.find((q) => q.table === "homework");
    expect(insert?.op).toBe("insert");
    const rows = insert?.values as Array<Record<string, unknown>>;
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.student_id)).toEqual(["s1", "s2"]);
    expect(new Set(rows.map((r) => r.assignment_group_id)).size).toBe(1);
    expect(rows.every((r) => r.created_by === "teacher-1")).toBe(true);
    expect(mocks.notifyUsers).toHaveBeenCalled();
  });

  it("yükleme hatasında satırlar geri alınır, bildirim gitmez, Türkçe hata fırlar", async () => {
    mocks.handle = createSupabaseMock({
      user: { id: "teacher-1" },
      results: { homework: [insertedRows] },
      storageUploadError: { message: "bucket dolu" },
    });
    const fd = baseForm();
    fd.set("attachment", new File(["içerik"], "Ödev Föyü.pdf", { type: "application/pdf" }));

    await expect(createHomework(fd)).rejects.toThrow(
      "Dosya eki yüklenemedi, ödev oluşturulamadı. Lütfen tekrar dene.",
    );

    const rollback = mocks.handle.queries.filter(
      (q) => q.table === "homework" && q.op === "delete",
    );
    expect(rollback).toHaveLength(1);
    expect(rollback[0].filters.some(([m, col]) => m === "eq" && col === "assignment_group_id")).toBe(
      true,
    );
    expect(mocks.notifyUsers).not.toHaveBeenCalled();
  });

  it("yüklenen dosyanın depolama yolu sanitize edilir, orijinal ad korunur", async () => {
    mocks.handle = createSupabaseMock({
      user: { id: "teacher-1" },
      results: { homework: [insertedRows] },
    });
    const fd = baseForm();
    fd.set("attachment", new File(["içerik"], "Ödev Föyü (1).pdf", { type: "application/pdf" }));
    await createHomework(fd);

    const upload = mocks.handle.storageCalls.find((c) => c.method === "upload");
    expect(String(upload?.args[0])).toMatch(/\/Odev_Foyu_1\.pdf$/);

    const attach = mocks.handle.queries.find(
      (q) => q.table === "homework" && q.op === "update",
    );
    expect((attach?.values as { attachment_name: string }).attachment_name).toBe(
      "Ödev Föyü (1).pdf",
    );
  });
});
