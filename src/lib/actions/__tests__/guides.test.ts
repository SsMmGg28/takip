import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock, type SupabaseMockHandle } from "@/test/supabase-mock";

const mocks = vi.hoisted(() => ({
  handle: null as unknown as SupabaseMockHandle,
  profile: null as null | { id: string; role: "student" | "parent" | "teacher" },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => mocks.handle.client,
}));
vi.mock("@/lib/auth", () => ({
  getCurrentProfile: async () => mocks.profile,
}));

import { saveGuideProgress } from "@/lib/actions/guides";

beforeEach(() => {
  mocks.handle = createSupabaseMock();
  mocks.profile = null;
});

describe("saveGuideProgress", () => {
  it("oturum yoksa veritabanına gitmeden reddeder", async () => {
    await expect(
      saveGuideProgress({
        guideId: "student-quick-start",
        version: 1,
        outcome: "completed",
      }),
    ).resolves.toEqual({ ok: false, error: "Yetkisiz." });
    expect(mocks.handle.queries).toHaveLength(0);
  });

  it("öğretmen rolünü reddeder", async () => {
    mocks.profile = { id: "teacher-1", role: "teacher" };
    const result = await saveGuideProgress({
      guideId: "student-quick-start",
      version: 1,
      outcome: "completed",
    });
    expect(result.ok).toBe(false);
    expect(mocks.handle.queries).toHaveLength(0);
  });

  it("başka role ait rehber ile geçersiz sürümü reddeder", async () => {
    mocks.profile = { id: "student-1", role: "student" };
    await expect(
      saveGuideProgress({
        guideId: "parent-quick-start",
        version: 1,
        outcome: "completed",
      }),
    ).resolves.toMatchObject({ ok: false });
    await expect(
      saveGuideProgress({
        guideId: "student-quick-start",
        version: 99,
        outcome: "completed",
      }),
    ).resolves.toMatchObject({ ok: false });
    expect(mocks.handle.queries).toHaveLength(0);
  });

  it("kullanıcı kimliğini oturumdan alıp birleşik anahtarla upsert eder", async () => {
    mocks.profile = { id: "student-1", role: "student" };
    const result = await saveGuideProgress({
      guideId: "student-quick-start",
      version: 1,
      outcome: "skipped",
    });

    expect(result).toEqual({ ok: true });
    const query = mocks.handle.queries[0];
    expect(query.op).toBe("upsert");
    expect(query.values).toMatchObject({
      user_id: "student-1",
      guide_id: "student-quick-start",
      version: 1,
      outcome: "skipped",
    });
    expect(query.filters).toContainEqual([
      "upsert-options",
      { onConflict: "user_id,guide_id" },
    ]);
  });

  it("veritabanı hatasını güvenli mesajla döndürür", async () => {
    mocks.profile = { id: "parent-1", role: "parent" };
    mocks.handle = createSupabaseMock({
      results: { user_guide_progress: [{ error: { message: "RLS denied" } }] },
    });
    await expect(
      saveGuideProgress({
        guideId: "parent-quick-start",
        version: 1,
        outcome: "completed",
      }),
    ).resolves.toEqual({ ok: false, error: "Rehber durumu kaydedilemedi." });
  });
});
