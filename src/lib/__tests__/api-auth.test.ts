import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Profile } from "@/lib/types";

const mocks = vi.hoisted(() => ({
  getCurrentProfile: vi.fn<() => Promise<Profile | null>>(),
}));

vi.mock("@/lib/auth", () => ({ getCurrentProfile: mocks.getCurrentProfile }));

import { requireTeacherApi } from "@/lib/api-auth";

function profileOf(role: Profile["role"]): Profile {
  return {
    id: "u1",
    role,
    username: "kullanici",
    full_name: "Test Kullanıcı",
    phone: null,
    must_change_password: false,
    theme_color: "blue",
    created_at: "2026-01-01T00:00:00Z",
  };
}

beforeEach(() => {
  mocks.getCurrentProfile.mockReset();
});

describe("requireTeacherApi", () => {
  it("oturum yoksa 401 ve Türkçe mesaj döner", async () => {
    mocks.getCurrentProfile.mockResolvedValue(null);
    const result = await requireTeacherApi();
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("beklenmedik ok");
    expect(result.response.status).toBe(401);
    expect(await result.response.json()).toEqual({ error: "Yetkisiz." });
  });

  it("öğrenci için 403 ve varsayılan mesaj döner", async () => {
    mocks.getCurrentProfile.mockResolvedValue(profileOf("student"));
    const result = await requireTeacherApi();
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("beklenmedik ok");
    expect(result.response.status).toBe(403);
    expect(await result.response.json()).toEqual({
      error: "Bu işlemi yalnızca öğretmen yapabilir.",
    });
  });

  it("özel yasak mesajı iletilir", async () => {
    mocks.getCurrentProfile.mockResolvedValue(profileOf("parent"));
    const result = await requireTeacherApi("Sadece öğretmen hesap silebilir.");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("beklenmedik ok");
    expect(await result.response.json()).toEqual({
      error: "Sadece öğretmen hesap silebilir.",
    });
  });

  it("öğretmende ok ve aynı profil nesnesi döner", async () => {
    const teacher = profileOf("teacher");
    mocks.getCurrentProfile.mockResolvedValue(teacher);
    const result = await requireTeacherApi();
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("beklenmedik hata");
    expect(result.profile).toBe(teacher);
  });
});
