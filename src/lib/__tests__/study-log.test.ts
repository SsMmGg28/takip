import { describe, it, expect } from "vitest";
import { addDays, computeStreak, summarizeWeek } from "@/lib/study-log";

describe("addDays", () => {
  it("gün ekler/çıkarır, ay/yıl sınırını aşar", () => {
    expect(addDays("2026-07-18", 1)).toBe("2026-07-19");
    expect(addDays("2026-07-31", 1)).toBe("2026-08-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });
});

describe("computeStreak", () => {
  const today = "2026-07-18";

  it("bugüne kadar uzanan ardışık günleri sayar", () => {
    const { current, best } = computeStreak(
      ["2026-07-16", "2026-07-17", "2026-07-18"],
      today,
    );
    expect(current).toBe(3);
    expect(best).toBe(3);
  });

  it("dün bittiyse seri korunur (bir gün tolerans)", () => {
    const { current } = computeStreak(["2026-07-16", "2026-07-17"], today);
    expect(current).toBe(2);
  });

  it("iki gün önce bittiyse güncel seri 0 ama best korunur", () => {
    const { current, best } = computeStreak(
      ["2026-07-14", "2026-07-15", "2026-07-16"],
      today,
    );
    expect(current).toBe(0);
    expect(best).toBe(3);
  });

  it("aynı günün tekrarları tek sayılır", () => {
    const { current } = computeStreak(["2026-07-18", "2026-07-18"], today);
    expect(current).toBe(1);
  });

  it("boşta 0", () => {
    expect(computeStreak([], today)).toEqual({ current: 0, best: 0 });
  });

  it("best, güncel seriden bağımsız en uzun diziyi bulur", () => {
    const { best } = computeStreak(
      ["2026-06-01", "2026-06-02", "2026-06-03", "2026-06-04", "2026-07-18"],
      today,
    );
    expect(best).toBe(4);
  });
});

describe("summarizeWeek", () => {
  const weekStart = "2026-07-13"; // Pazartesi
  const logs = [
    { log_date: "2026-07-13", subject: "Matematik", minutes: 30 },
    { log_date: "2026-07-13", subject: "Fen Bilimleri", minutes: 20 },
    { log_date: "2026-07-15", subject: "Matematik", minutes: 40 },
    { log_date: "2026-07-19", subject: "Matematik", minutes: 25 }, // Pazar (hafta içi)
    { log_date: "2026-07-20", subject: "Türkçe", minutes: 60 }, // sonraki hafta → hariç
  ];

  it("hafta içi günleri/dakikaları toplar, ders dökümünü sıralar", () => {
    const s = summarizeWeek(logs, weekStart);
    expect(s.days).toBe(3); // 13, 15, 19
    expect(s.minutes).toBe(30 + 20 + 40 + 25);
    expect(s.bySubject[0]).toEqual({ subject: "Matematik", minutes: 95 });
    expect(s.bySubject.find((x) => x.subject === "Türkçe")).toBeUndefined();
  });
});
