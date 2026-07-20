import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock, type SupabaseMockHandle } from "@/test/supabase-mock";

const mocks = vi.hoisted(() => ({
  handle: null as unknown as SupabaseMockHandle,
  assertTeacherAction: vi.fn(),
  notifyUsers: vi.fn(async () => {}),
  updateTag: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => mocks.handle.client,
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  updateTag: mocks.updateTag,
}));
vi.mock("@/lib/auth", () => ({ assertTeacherAction: mocks.assertTeacherAction }));
vi.mock("@/lib/notifications", () => ({
  notifyUsers: mocks.notifyUsers,
  getTeacherIds: vi.fn(async () => []),
}));
vi.mock("@/lib/books", () => ({ BOOK_CATALOG_TAG: "book-catalog" }));

import {
  addBookToShelf,
  deleteBook,
  rejectBook,
  withdrawPendingBook,
} from "@/lib/actions/resources";

function form(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  mocks.assertTeacherAction.mockReset();
  mocks.assertTeacherAction.mockResolvedValue({ id: "teacher-1", role: "teacher" });
  mocks.notifyUsers.mockClear();
  mocks.updateTag.mockClear();
});

describe("withdrawPendingBook", () => {
  it("silme sorgusu id + sahiplik + onaysızlık filtrelerini taşır", async () => {
    mocks.handle = createSupabaseMock({
      user: { id: "parent-1" },
      results: { resource_books: [{ data: [{ id: "book-1" }] }] },
    });
    await withdrawPendingBook(form({ id: "book-1" }));

    const del = mocks.handle.queries.find((q) => q.table === "resource_books");
    expect(del?.op).toBe("delete");
    expect(del?.filters).toContainEqual(["eq", "id", "book-1"]);
    expect(del?.filters).toContainEqual(["eq", "created_by", "parent-1"]);
    expect(del?.filters).toContainEqual(["eq", "approved", false]);
    expect(mocks.updateTag).toHaveBeenCalledWith("book-catalog");
  });

  it("satır dönmezse açık hata verir", async () => {
    mocks.handle = createSupabaseMock({
      user: { id: "parent-1" },
      results: { resource_books: [{ data: [] }] },
    });
    await expect(withdrawPendingBook(form({ id: "baskasinin" }))).rejects.toThrow(
      "Bekleyen kitap bulunamadı veya geri çekme yetkin yok.",
    );
  });

  it("oturum yoksa hiç sorgu atmadan fırlatır", async () => {
    mocks.handle = createSupabaseMock({ user: null });
    await expect(withdrawPendingBook(form({ id: "book-1" }))).rejects.toThrow(
      "Yetkisiz.",
    );
    expect(mocks.handle.queries).toHaveLength(0);
  });
});

describe("rejectBook", () => {
  it("öğretmen değilse guard fırlatır ve sorgu atılmaz", async () => {
    mocks.assertTeacherAction.mockRejectedValue(
      new Error("Bu işlemi yalnızca öğretmen yapabilir."),
    );
    mocks.handle = createSupabaseMock({ user: { id: "parent-1" } });
    await expect(rejectBook(form({ id: "book-1" }))).rejects.toThrow(
      "Bu işlemi yalnızca öğretmen yapabilir.",
    );
    expect(mocks.handle.queries).toHaveLength(0);
  });

  it("onaylı kitap reddedilemez", async () => {
    mocks.handle = createSupabaseMock({
      user: { id: "teacher-1" },
      results: {
        resource_books: [
          { data: { id: "book-1", name: "Kitap", created_by: "p1", approved: true } },
        ],
      },
    });
    await expect(rejectBook(form({ id: "book-1" }))).rejects.toThrow(
      "Bekleyen kitap bulunamadı.",
    );
  });

  it("başarıda kitabı ekleyene bildirim gider", async () => {
    mocks.handle = createSupabaseMock({
      user: { id: "teacher-1" },
      results: {
        resource_books: [
          {
            data: {
              id: "book-1",
              name: "Deneme Bankası",
              created_by: "parent-9",
              approved: false,
            },
          },
          { data: null },
        ],
      },
    });
    await rejectBook(form({ id: "book-1" }));
    expect(mocks.notifyUsers).toHaveBeenCalledWith(
      ["parent-9"],
      expect.objectContaining({ type: "book_rejected" }),
    );
  });
});

describe("deleteBook", () => {
  it("öğretmen guard'ı ilk sırada çalışır", async () => {
    mocks.assertTeacherAction.mockRejectedValue(new Error("Yetkisiz."));
    mocks.handle = createSupabaseMock({ user: null });
    await expect(deleteBook(form({ id: "book-1" }))).rejects.toThrow("Yetkisiz.");
    expect(mocks.handle.queries).toHaveLength(0);
  });

  it("silme hatası mesajıyla iletilir", async () => {
    mocks.handle = createSupabaseMock({
      user: { id: "teacher-1" },
      results: { resource_books: [{ error: { message: "fk ihlali" } }] },
    });
    await expect(deleteBook(form({ id: "book-1" }))).rejects.toThrow("fk ihlali");
  });
});

describe("addBookToShelf", () => {
  it("aynı kitap ikinci kez eklenirse (23505) sessizce geçer", async () => {
    mocks.handle = createSupabaseMock({
      user: { id: "parent-1" },
      results: {
        student_books: [{ error: { message: "duplicate key value", code: "23505" } }],
      },
    });
    await expect(
      addBookToShelf(form({ student_id: "s1", book_id: "b1" })),
    ).resolves.toBeUndefined();
  });

  it("diğer hata kodları fırlatılır", async () => {
    mocks.handle = createSupabaseMock({
      user: { id: "parent-1" },
      results: {
        student_books: [{ error: { message: "check ihlali", code: "23514" } }],
      },
    });
    await expect(
      addBookToShelf(form({ student_id: "s1", book_id: "b1" })),
    ).rejects.toThrow("check ihlali");
  });
});
