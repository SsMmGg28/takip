import { describe, it, expect, vi, afterEach } from "vitest";
import { postAdmin } from "@/lib/admin-api";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("postAdmin", () => {
  it("başarılı yanıtta ok ve veri döner", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ username: "ali" })));
    const result = await postAdmin<{ username: string }>("create-user", { full_name: "Ali" });
    expect(result).toEqual({ ok: true, data: { username: "ali" } });
  });

  it("hata gövdesindeki mesajı iletir", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ error: "Geçersiz bilgi." }, 400)),
    );
    const result = await postAdmin("create-user", {});
    expect(result).toEqual({ ok: false, error: "Geçersiz bilgi." });
  });

  it("gövdesi ayrıştırılamayan hatada genel mesaj döner", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("içeride hata", { status: 500 })),
    );
    const result = await postAdmin("delete-user", {});
    expect(result).toEqual({ ok: false, error: "Bir hata oluştu." });
  });

  it("ağ hatasında Türkçe bağlantı mesajı döner", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("failed"))));
    const result = await postAdmin("manage-links", {});
    expect(result).toEqual({
      ok: false,
      error: "Sunucuya ulaşılamadı. Bağlantını kontrol et.",
    });
  });

  it("doğru URL'ye JSON gövdeli POST atar", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);
    await postAdmin("reset-password", { profile_id: "p1" });
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_id: "p1" }),
    });
  });
});
