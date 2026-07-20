// Hafta yardımcıları: çalışma programı kayıtları haftanın Pazartesi tarihine
// (YYYY-MM-DD) bağlanır. Tüm hesaplar Europe/Istanbul gününe göre yapılır.

const DAY_MS = 86_400_000;

function toYMD(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** İçinde bulunulan haftanın Pazartesi tarihi (Europe/Istanbul). */
export function currentWeekStart(): string {
  const tr = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" }),
  );
  const utc = new Date(Date.UTC(tr.getFullYear(), tr.getMonth(), tr.getDate()));
  const dow = (utc.getUTCDay() + 6) % 7; // Pzt=0
  return toYMD(new Date(utc.getTime() - dow * DAY_MS));
}

/** Bugünün tarihi (Europe/Istanbul, YYYY-MM-DD) — çalışma günlüğü/streak için. */
export function todayInIstanbul(): string {
  const tr = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" }),
  );
  return toYMD(new Date(Date.UTC(tr.getFullYear(), tr.getMonth(), tr.getDate())));
}

/** Verilen hafta başına n hafta ekler/çıkarır. */
export function addWeeks(weekStart: string, n: number): string {
  const d = new Date(`${weekStart}T00:00:00Z`);
  return toYMD(new Date(d.getTime() + n * 7 * DAY_MS));
}

/** ?week= parametresini doğrular: geçerli bir Pazartesi değilse güncel hafta. */
export function parseWeekParam(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const d = new Date(`${value}T00:00:00Z`);
    if (!Number.isNaN(d.getTime()) && (d.getUTCDay() + 6) % 7 === 0) return value;
  }
  return currentWeekStart();
}

/** "6 – 12 Ekim 2026" biçiminde hafta aralığı etiketi. */
export function formatWeekRange(weekStart: string): string {
  const start = new Date(`${weekStart}T00:00:00Z`);
  const end = new Date(start.getTime() + 6 * DAY_MS);
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  };
  const endLabel = end.toLocaleDateString("tr-TR", { ...opts, year: "numeric" });
  if (start.getUTCMonth() === end.getUTCMonth()) {
    return `${start.getUTCDate()} – ${endLabel}`;
  }
  return `${start.toLocaleDateString("tr-TR", opts)} – ${endLabel}`;
}
