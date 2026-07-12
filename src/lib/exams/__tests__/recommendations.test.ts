import { describe, it, expect } from "vitest";
import {
  pickRecommendation,
  successRate,
  targetDifficulty,
  type CandidateSection,
  type WeakKazanim,
} from "@/lib/exams/recommendations";

function weak(o: Partial<WeakKazanim>): WeakKazanim {
  return {
    subject: o.subject ?? "Matematik",
    code: o.code ?? "M8-01",
    name: o.name ?? "Üslü İfadeler",
    incorrect: o.incorrect ?? 0,
    blank: o.blank ?? 0,
    asked: o.asked ?? 10,
    priorityScore: o.priorityScore ?? 1,
  };
}

function cand(
  o: Partial<CandidateSection> & { sectionId: string },
): CandidateSection {
  return {
    sectionId: o.sectionId,
    sectionName: o.sectionName ?? `Bölüm ${o.sectionId}`,
    bookId: o.bookId ?? `book-${o.sectionId}`,
    bookName: o.bookName ?? `Kitap ${o.sectionId}`,
    testCount: o.testCount ?? 10,
    difficulty: o.difficulty ?? null,
    solvedTests: o.solvedTests ?? new Set<number>(),
    onShelf: o.onShelf ?? false,
  };
}

describe("successRate", () => {
  it("hepsi doğru → 1", () => {
    expect(successRate({ incorrect: 0, blank: 0, asked: 10 })).toBe(1);
  });
  it("hepsi yanlış → 0", () => {
    expect(successRate({ incorrect: 10, blank: 0, asked: 10 })).toBe(0);
  });
  it("hepsi boş → 0.5 (boş yarım ağırlık)", () => {
    expect(successRate({ incorrect: 0, blank: 10, asked: 10 })).toBe(0.5);
  });
  it("karışık: 2 yanlış + 2 boş / 10 → 0.7", () => {
    expect(successRate({ incorrect: 2, blank: 2, asked: 10 })).toBeCloseTo(0.7);
  });
  it("soru yoksa → 1 (nötr)", () => {
    expect(successRate({ incorrect: 0, blank: 0, asked: 0 })).toBe(1);
  });
});

describe("targetDifficulty", () => {
  it("başarı 1.0 → 5★", () => expect(targetDifficulty(1)).toBe(5));
  it("başarı 0.0 → 1★", () => expect(targetDifficulty(0)).toBe(1));
  it("başarı 0.5 → 3★", () => expect(targetDifficulty(0.5)).toBe(3));
  it("başarı 0.9 (1 yanlış/10) → 5★ (zor)", () => expect(targetDifficulty(0.9)).toBe(5));
  it("başarı 0.2 (8 yanlış/10) → 2★ (kolay)", () => expect(targetDifficulty(0.2)).toBe(2));
});

describe("pickRecommendation", () => {
  it("başarı yüksekse (1 yanlış/10) daha ZOR kitabı önerir", () => {
    const rec = pickRecommendation(weak({ incorrect: 1, asked: 10 }), [
      cand({ sectionId: "kolay", difficulty: 2 }),
      cand({ sectionId: "zor", difficulty: 5 }),
    ]);
    expect(rec.targetStars).toBe(5);
    expect(rec.section?.id).toBe("zor");
    expect(rec.difficulty).toBe(5);
    expect(rec.status).toBe("unsolved");
  });

  it("başarı düşükse (8 yanlış/10) daha KOLAY kitabı önerir", () => {
    const rec = pickRecommendation(weak({ incorrect: 8, asked: 10 }), [
      cand({ sectionId: "kolay", difficulty: 2 }),
      cand({ sectionId: "zor", difficulty: 5 }),
    ]);
    expect(rec.targetStars).toBe(2);
    expect(rec.section?.id).toBe("kolay");
  });

  it("tamamen çözülmüş bölümü eler, çözülmemişi önerir", () => {
    const rec = pickRecommendation(weak({ incorrect: 5, asked: 10 }), [
      cand({
        sectionId: "bitmis",
        difficulty: 3,
        testCount: 3,
        solvedTests: new Set([1, 2, 3]),
      }),
      cand({ sectionId: "taze", difficulty: 3, testCount: 3 }),
    ]);
    expect(rec.section?.id).toBe("taze");
  });

  it("çözülmemişi yarım kalmışa tercih eder (zorluk eşitken)", () => {
    const rec = pickRecommendation(weak({ incorrect: 5, asked: 10 }), [
      cand({ sectionId: "yarim", difficulty: 3, solvedTests: new Set([1]) }),
      cand({ sectionId: "hic", difficulty: 3 }),
    ]);
    expect(rec.section?.id).toBe("hic");
    expect(rec.status).toBe("unsolved");
  });

  it("hiç aday yoksa reason='no-book'", () => {
    const rec = pickRecommendation(weak({ incorrect: 5, asked: 10 }), []);
    expect(rec.book).toBeNull();
    expect(rec.reason).toBe("no-book");
  });

  it("tüm adaylar bitmişse reason='all-solved'", () => {
    const rec = pickRecommendation(weak({ incorrect: 5, asked: 10 }), [
      cand({ sectionId: "b", testCount: 2, solvedTests: new Set([1, 2]) }),
    ]);
    expect(rec.book).toBeNull();
    expect(rec.reason).toBe("all-solved");
  });

  it("çözülmemiş test numaralarını (ilk 5) önerir", () => {
    const rec = pickRecommendation(weak({ incorrect: 5, asked: 10 }), [
      cand({ sectionId: "b", difficulty: 3, testCount: 8, solvedTests: new Set([1, 2]) }),
    ]);
    expect(rec.suggestedTests).toEqual([3, 4, 5, 6, 7]);
  });

  it("eşit zorlukta raftaki kitabı önce önerir", () => {
    const rec = pickRecommendation(weak({ incorrect: 5, asked: 10 }), [
      cand({ sectionId: "raf-disi", difficulty: 3, onShelf: false }),
      cand({ sectionId: "rafta", difficulty: 3, onShelf: true }),
    ]);
    expect(rec.section?.id).toBe("rafta");
    expect(rec.onShelf).toBe(true);
  });

  it("derecesiz kitabı yedek olarak yine önerir", () => {
    const rec = pickRecommendation(weak({ incorrect: 5, asked: 10 }), [
      cand({ sectionId: "derecesiz", difficulty: null }),
    ]);
    expect(rec.section?.id).toBe("derecesiz");
    expect(rec.difficulty).toBeNull();
    expect(rec.reason).toBeUndefined();
  });

  it("derecesi olan kitabı derecesize tercih eder", () => {
    const rec = pickRecommendation(weak({ incorrect: 5, blank: 0, asked: 10 }), [
      cand({ sectionId: "derecesiz", difficulty: null }),
      cand({ sectionId: "dereceli", difficulty: 3 }),
    ]);
    // başarı 0.5 → hedef 3★; dereceli (mesafe 0) derecesizden (Infinity) önce
    expect(rec.section?.id).toBe("dereceli");
  });
});
