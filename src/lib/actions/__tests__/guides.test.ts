import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock, type SupabaseMockHandle } from "@/test/supabase-mock";

const mocks = vi.hoisted(() => ({
  handle: null as unknown as SupabaseMockHandle,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mocks.handle.client),
}));

import { saveGuideProgress } from "@/lib/actions/guides";
import { getGuideById } from "@/lib/guides";

const studentQuickStartVersion = getGuideById("student-quick-start")!.version;

beforeEach(() => {
  mocks.handle = createSupabaseMock();
});

describe("saveGuideProgress", () => {
  it("oturum kimliğini kullanarak doğrulanmış sürümü upsert eder", async () => {
    mocks.handle = createSupabaseMock({
      user: { id: "student-1" },
      results: {
        profiles: [{ data: { role: "student" } }],
        user_guide_progress: [{ data: null }],
      },
    });

    await expect(
      saveGuideProgress({
        guideId: "student-quick-start",
        version: studentQuickStartVersion,
        outcome: "completed",
      }),
    ).resolves.toEqual({ success: true });

    const query = mocks.handle.queries.find(
      (entry) => entry.table === "user_guide_progress",
    );
    expect(query?.op).toBe("upsert");
    expect(query?.values).toMatchObject({
      user_id: "student-1",
      guide_id: "student-quick-start",
      version: studentQuickStartVersion,
      outcome: "completed",
    });
    expect(query?.filters).toContainEqual([
      "upsert-options",
      { onConflict: "user_id,guide_id" },
    ]);
  });

  it("oturumsuz çağrıyı hiçbir tablo yazmadan reddeder", async () => {
    mocks.handle = createSupabaseMock({ user: null });
    await expect(
      saveGuideProgress({
        guideId: "student-quick-start",
        version: studentQuickStartVersion,
        outcome: "completed",
      }),
    ).rejects.toThrow("Yetkisiz");
    expect(mocks.handle.queries).toHaveLength(0);
  });

  it.each([
    ["bilinmeyen", 1, "Geçersiz rehber veya sürüm"],
    ["student-quick-start", 999, "Geçersiz rehber veya sürüm"],
  ])("%s / %s girdisini reddeder", async (guideId, version, message) => {
    mocks.handle = createSupabaseMock({ user: { id: "student-1" } });
    await expect(
      saveGuideProgress({
        guideId,
        version,
        outcome: "completed",
      }),
    ).rejects.toThrow(message);
    expect(mocks.handle.queries).toHaveLength(0);
  });

  it("rolüne ait olmayan veya öğretmen rehber kaydını reddeder", async () => {
    mocks.handle = createSupabaseMock({
      user: { id: "teacher-1" },
      results: { profiles: [{ data: { role: "teacher" } }] },
    });
    await expect(
      saveGuideProgress({
        guideId: "student-quick-start",
        version: studentQuickStartVersion,
        outcome: "skipped",
      }),
    ).rejects.toThrow("uygun değil");
    expect(
      mocks.handle.queries.filter((entry) => entry.table === "user_guide_progress"),
    ).toHaveLength(0);
  });

  it("istemciden kullanıcı kimliği kabul etmez", () => {
    expect(saveGuideProgress.length).toBe(1);
  });
});
