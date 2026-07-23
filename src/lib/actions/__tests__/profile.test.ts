import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock, type SupabaseMockHandle } from "@/test/supabase-mock";

const mocks = vi.hoisted(() => ({
  handle: null as unknown as SupabaseMockHandle,
  refresh: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => mocks.handle.client,
}));
vi.mock("next/cache", () => ({
  refresh: mocks.refresh,
  updateTag: vi.fn(),
}));

import { updateOwnThemeColor } from "@/lib/actions/profile";

const user = { id: "user-1" };

beforeEach(() => {
  mocks.refresh.mockReset();
});

describe("updateOwnThemeColor", () => {
  it("geçersiz renk hiç sorgu atmadan reddedilir", async () => {
    mocks.handle = createSupabaseMock({ user });
    const res = await updateOwnThemeColor("cyan");
    expect(res).toEqual({ ok: false, error: "Geçersiz tema rengi." });
    expect(mocks.handle.queries).toHaveLength(0);
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it("oturum yoksa yetkisiz döner", async () => {
    mocks.handle = createSupabaseMock({ user: null });
    const res = await updateOwnThemeColor("green");
    expect(res).toEqual({ ok: false, error: "Yetkisiz." });
    expect(mocks.handle.queries).toHaveLength(0);
  });

  it("happy path: kendi satırına theme_color yazar ve tazeler", async () => {
    mocks.handle = createSupabaseMock({ user, results: { profiles: [{ error: null }] } });
    const res = await updateOwnThemeColor("purple");
    expect(res).toEqual({ ok: true });

    const upd = mocks.handle.queries.find((q) => q.table === "profiles");
    expect(upd?.op).toBe("update");
    expect(upd?.values).toEqual({ theme_color: "purple" });
    expect(upd?.filters).toContainEqual(["eq", "id", "user-1"]);
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("veritabanı hatası mesajıyla iletilir", async () => {
    mocks.handle = createSupabaseMock({
      user,
      results: { profiles: [{ error: { message: "update kilitli" } }] },
    });
    const res = await updateOwnThemeColor("rose");
    expect(res).toEqual({ ok: false, error: "update kilitli" });
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
