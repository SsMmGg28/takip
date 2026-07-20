// İstemci bileşenlerinin /api/admin uçlarına ortak erişimi. fetch + JSON +
// hata ayrıştırma kalıbını tek yerde toplar.

export type AdminApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function postAdmin<T = Record<string, unknown>>(
  endpoint:
    "create-user" | "delete-user" | "update-user" | "reset-password" | "manage-links",
  body: unknown,
): Promise<AdminApiResult<T>> {
  try {
    const res = await fetch(`/api/admin/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) return { ok: false, error: data.error ?? "Bir hata oluştu." };
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Sunucuya ulaşılamadı. Bağlantını kontrol et." };
  }
}
