import { describe, it, expect } from "vitest";
import {
  matchCanonicalSubject,
  normalizeImportedExam,
  type RawParsedExam,
  type RawParsedSubject,
} from "@/lib/exams/import-normalize";
import type { ExamFormInitial } from "@/components/exams/exam-entry-form";

function subj(initial: ExamFormInitial, name: string) {
  const s = initial.subjects.find((x) => x.name === name);
  if (!s) throw new Error(`ders bulunamadı: ${name}`);
  return s;
}

/** Kolay okunur karşılaştırma için ders sonucunu "D/Y/B" dizisine indirger. */
function dyb(initial: ExamFormInitial, name: string): [number, number, number] {
  const s = subj(initial, name);
  return [s.correct, s.incorrect, s.blank];
}

describe("matchCanonicalSubject", () => {
  const cases: [string, string | null][] = [
    ["Türkçe", "Türkçe"],
    ["LGS-TÜRKÇE", "Türkçe"],
    ["LGS-MATEMATİK", "Matematik"],
    ["Fen Bilimleri", "Fen Bilimleri"],
    ["LGS-FEN BİLİMLERİ", "Fen Bilimleri"],
    ["T.C. İnkılap Tarihi ve Atatürkçülük", "T.C. İnkılap Tarihi"],
    ["LGS-İNKILAP TARİHİ", "T.C. İnkılap Tarihi"],
    ["Sosyal Bilgiler", "T.C. İnkılap Tarihi"],
    ["Din Kültürü ve Ahlak Bilgisi", "Din Kültürü"],
    ["LGS-DİN KÜLTÜRÜ VE AHLAK BİLGİSİ", "Din Kültürü"],
    ["Yabancı Dil", "İngilizce"],
    ["İngilizce", "İngilizce"],
    ["LGS-İNGİLİZCE", "İngilizce"],
    ["Bilmemne Dersi", null],
  ];
  it.each(cases)("%s -> %s", (input, expected) => {
    expect(matchCanonicalSubject(input)).toBe(expected);
  });
});

describe("normalizeImportedExam - örnek belgeler", () => {
  it("Format B: AYDIN GELİŞİM LGS-5 (boş hücreler atlanmış)", () => {
    // Format B'de 0 değerler belgede boş bırakılıyor; Gemini blank'i 0 döner.
    const raw: RawParsedExam = {
      examName: "AYDIN GELİŞİM LGS-5(AYDIN GELİŞİM LGS-5)",
      examDate: "2026-06-11",
      score: "494,51",
      subjects: [
        { name: "LGS-TÜRKÇE", correct: 20, incorrect: 0, blank: 0 },
        { name: "LGS-İNKILAP TARİHİ", correct: 10, incorrect: 0, blank: 0 },
        { name: "LGS-DİN KÜLTÜRÜ VE AHLAK BİLGİSİ", correct: 10, incorrect: 0, blank: 0 },
        { name: "LGS-İNGİLİZCE", correct: 10, incorrect: 0, blank: 0 },
        { name: "LGS-MATEMATİK", correct: 20, incorrect: 0, blank: 0 },
        { name: "LGS-FEN BİLİMLERİ", correct: 19, incorrect: 1, blank: 0 },
      ],
    };
    const { initial, warnings } = normalizeImportedExam(raw, 8);
    expect(initial.examName).toBe("AYDIN GELİŞİM LGS-5");
    expect(initial.examDate).toBe("2026-06-11");
    expect(initial.score).toBe(494.51);
    expect(dyb(initial, "Türkçe")).toEqual([20, 0, 0]);
    expect(dyb(initial, "T.C. İnkılap Tarihi")).toEqual([10, 0, 0]);
    expect(dyb(initial, "Din Kültürü")).toEqual([10, 0, 0]);
    expect(dyb(initial, "İngilizce")).toEqual([10, 0, 0]);
    expect(dyb(initial, "Matematik")).toEqual([20, 0, 0]);
    expect(dyb(initial, "Fen Bilimleri")).toEqual([19, 1, 0]);
    expect(warnings).toHaveLength(0);
  });

  it("Format B: SİNAN KUZUCU TG LGS-7", () => {
    const raw: RawParsedExam = {
      examName: "SİNAN KUZUCU TG LGS-7(SİNAN KUZUCU TG LGS-7)",
      examDate: "2026-06-08",
      score: "476,76",
      subjects: [
        { name: "LGS-TÜRKÇE", correct: 19, incorrect: 1, blank: 0 },
        { name: "LGS-İNKILAP TARİHİ", correct: 10, incorrect: 0, blank: 0 },
        { name: "LGS-DİN KÜLTÜRÜ VE AHLAK BİLGİSİ", correct: 10, incorrect: 0, blank: 0 },
        { name: "LGS-İNGİLİZCE", correct: 10, incorrect: 0, blank: 0 },
        { name: "LGS-MATEMATİK", correct: 19, incorrect: 1, blank: 0 },
        { name: "LGS-FEN BİLİMLERİ", correct: 18, incorrect: 2, blank: 0 },
      ],
    };
    const { initial, warnings } = normalizeImportedExam(raw, 8);
    expect(initial.examName).toBe("SİNAN KUZUCU TG LGS-7");
    expect(initial.score).toBe(476.76);
    expect(dyb(initial, "Türkçe")).toEqual([19, 1, 0]);
    expect(dyb(initial, "Matematik")).toEqual([19, 1, 0]);
    expect(dyb(initial, "Fen Bilimleri")).toEqual([18, 2, 0]);
    expect(warnings).toHaveLength(0);
  });

  it("Format B: ÜÇDÖRTBEŞ HAZİRAN LGS-6 (boş sayıları eksik gelirse hesaplanır)", () => {
    // Bu senaryoda Gemini blank alanını hiç göndermiyor -> normalize hesaplamalı.
    const raw: RawParsedExam = {
      examName: "ÜÇDÖRTBEŞ HAZİRAN LGS-6 SON PROVA(ÜÇDÖRTBEŞ HAZİRAN LGS-6 SON PROVA)",
      examDate: "2026-06-03",
      score: "467,62",
      subjects: [
        { name: "Türkçe", correct: 17, incorrect: 3 },
        { name: "İnkılap Tarihi", correct: 9, incorrect: 1 },
        { name: "Din Kültürü", correct: 10, incorrect: 0 },
        { name: "İngilizce", correct: 10, incorrect: 0 },
        { name: "Matematik", correct: 19, incorrect: 1 },
        { name: "Fen Bilimleri", correct: 19, incorrect: 1 },
      ],
    };
    const { initial, warnings } = normalizeImportedExam(raw, 8);
    expect(initial.score).toBe(467.62);
    expect(dyb(initial, "Türkçe")).toEqual([17, 3, 0]);
    expect(dyb(initial, "T.C. İnkılap Tarihi")).toEqual([9, 1, 0]);
    expect(dyb(initial, "Matematik")).toEqual([19, 1, 0]);
    expect(dyb(initial, "Fen Bilimleri")).toEqual([19, 1, 0]);
    expect(warnings).toHaveLength(0);
  });

  it("Format A: OKYANUS (Yabancı Dil -> İngilizce, boş sütunu yok, DD.MM.YYYY, '462,700')", () => {
    const raw: RawParsedExam = {
      examName: "OKYANUS CLASSMATE",
      examDate: "7.12.2025",
      score: "462,700",
      subjects: [
        { name: "Türkçe", correct: 19, incorrect: 1 },
        { name: "T.C. İnkılap Tarihi ve Atatürkçülük", correct: 9, incorrect: 1 },
        { name: "Din Kültürü ve Ahlak Bilgisi", correct: 8, incorrect: 2 },
        { name: "Yabancı Dil", correct: 10, incorrect: 0 },
        { name: "Matematik", correct: 18, incorrect: 2 },
        { name: "Fen Bilimleri", correct: 18, incorrect: 2 },
      ],
    };
    const { initial, warnings } = normalizeImportedExam(raw, 8);
    expect(initial.examName).toBe("OKYANUS CLASSMATE");
    expect(initial.examDate).toBe("2025-12-07");
    expect(initial.score).toBe(462.7);
    expect(dyb(initial, "Türkçe")).toEqual([19, 1, 0]);
    expect(dyb(initial, "T.C. İnkılap Tarihi")).toEqual([9, 1, 0]);
    expect(dyb(initial, "Din Kültürü")).toEqual([8, 2, 0]);
    expect(dyb(initial, "İngilizce")).toEqual([10, 0, 0]);
    expect(dyb(initial, "Matematik")).toEqual([18, 2, 0]);
    expect(dyb(initial, "Fen Bilimleri")).toEqual([18, 2, 0]);
    expect(warnings).toHaveLength(0);
  });
});

describe("normalizeImportedExam - kenar durumlar", () => {
  it("eksik ders için uyarı üretir ve 0/0/0 döner", () => {
    const raw: RawParsedExam = {
      examName: "Yarım Belge",
      examDate: "2026-01-01",
      score: "300",
      subjects: [{ name: "Türkçe", correct: 20, incorrect: 0, blank: 0 }],
    };
    const { initial, warnings } = normalizeImportedExam(raw, 8);
    expect(dyb(initial, "Matematik")).toEqual([0, 0, 0]);
    expect(warnings.some((w) => w.includes("Matematik"))).toBe(true);
  });

  it("puan okunamazsa null döner ve uyarı ekler", () => {
    const raw: RawParsedExam = {
      examName: "X",
      examDate: "2026-01-01",
      score: "",
      subjects: [],
    };
    const { initial, warnings } = normalizeImportedExam(raw, 8);
    expect(initial.score).toBeNull();
    expect(warnings.some((w) => w.toLowerCase().includes("puan"))).toBe(true);
  });

  it("doğru sayısı soru sayısını aşarsa kırpar ve uyarır", () => {
    const raw: RawParsedExam = {
      examName: "Hatalı",
      examDate: "2026-01-01",
      score: "250",
      subjects: [{ name: "İngilizce", correct: 12, incorrect: 3, blank: 0 }],
    };
    const { initial, warnings } = normalizeImportedExam(raw, 8);
    const ing = subj(initial, "İngilizce");
    // Değerler tek tek soru sayısıyla sınırlanır; tutarsızlık uyarı olarak bildirilir
    // (kullanıcı formda düzeltir, katı doğrulama kaydı zaten engeller).
    expect(ing.correct).toBeLessThanOrEqual(10);
    expect(ing.incorrect).toBeLessThanOrEqual(10);
    expect(warnings.length).toBeGreaterThan(0);
  });
});

/** 6 dersi tam dolu üretir; verilen ders adına override uygular (kazanım eklemek için). */
function six(overrides: Record<string, RawParsedSubject> = {}): RawParsedSubject[] {
  const base: RawParsedSubject[] = [
    { name: "Türkçe", correct: 20, incorrect: 0, blank: 0 },
    { name: "Matematik", correct: 20, incorrect: 0, blank: 0 },
    { name: "Fen Bilimleri", correct: 20, incorrect: 0, blank: 0 },
    { name: "T.C. İnkılap Tarihi", correct: 10, incorrect: 0, blank: 0 },
    { name: "Din Kültürü", correct: 10, incorrect: 0, blank: 0 },
    { name: "İngilizce", correct: 10, incorrect: 0, blank: 0 },
  ];
  return base.map((s) => (overrides[s.name as string] ? overrides[s.name as string] : s));
}

describe("normalizeImportedExam - Faz 2 kazanım eşleştirme", () => {
  it("geçerli katalog kodlarını forma enjekte eder ve aynı kodu toplar", () => {
    const raw: RawParsedExam = {
      examName: "K",
      examDate: "2026-01-01",
      score: "400",
      subjects: six({
        Matematik: {
          name: "Matematik",
          correct: 18,
          incorrect: 2,
          blank: 0,
          kazanimlar: [
            { code: "M8-02", correct: 2, incorrect: 1, blank: 0 }, // Üslü İfadeler
            { code: "M8-03", correct: 4, incorrect: 0, blank: 0 }, // Kareköklü İfadeler
            { code: "M8-09", correct: 3, incorrect: 1, blank: 0 }, // Üçgenler
            { code: "M8-09", correct: 1, incorrect: 0, blank: 0 }, // aynı kod -> toplanır
          ],
        },
      }),
    };
    const { initial } = normalizeImportedExam(raw, 8);
    const mat = subj(initial, "Matematik");
    const byCode = Object.fromEntries(mat.kazanimlar.map((k) => [k.code, k]));
    expect(Object.keys(byCode).sort()).toEqual(["M8-02", "M8-03", "M8-09"]);
    expect(byCode["M8-09"]).toMatchObject({ correct: 4, incorrect: 1, blank: 0 });
    expect(byCode["M8-02"]).toMatchObject({ correct: 2, incorrect: 1, blank: 0 });
  });

  it("bilinmeyen kodu atar ve uyarı verir; D+Y+B=0 satırı düşer", () => {
    const raw: RawParsedExam = {
      examName: "K",
      examDate: "2026-01-01",
      score: "400",
      subjects: six({
        Matematik: {
          name: "Matematik",
          correct: 20,
          incorrect: 0,
          blank: 0,
          kazanimlar: [
            { code: "M8-99", correct: 3, incorrect: 0, blank: 0 }, // katalogda yok
            { code: "M8-01", correct: 0, incorrect: 0, blank: 0 }, // boş -> düşer
            { code: "M8-04", correct: 5, incorrect: 0, blank: 0 }, // Veri Analizi
          ],
        },
      }),
    };
    const { initial, warnings } = normalizeImportedExam(raw, 8);
    const mat = subj(initial, "Matematik");
    expect(mat.kazanimlar.map((k) => k.code)).toEqual(["M8-04"]);
    expect(warnings.some((w) => w.includes("M8-99"))).toBe(true);
  });

  it("kazanım toplamı ders soru sayısını aşarsa kazanım enjekte etmez + uyarır", () => {
    const raw: RawParsedExam = {
      examName: "K",
      examDate: "2026-01-01",
      score: "400",
      subjects: six({
        İngilizce: {
          name: "İngilizce",
          correct: 10,
          incorrect: 0,
          blank: 0,
          kazanimlar: [
            { code: "E8-01", correct: 8, incorrect: 0, blank: 0 },
            { code: "E8-02", correct: 6, incorrect: 0, blank: 0 }, // toplam 14 > 10
          ],
        },
      }),
    };
    const { initial, warnings } = normalizeImportedExam(raw, 8);
    expect(subj(initial, "İngilizce").kazanimlar).toHaveLength(0);
    expect(warnings.some((w) => w.toLowerCase().includes("aşıyor"))).toBe(true);
  });

  it("kodlar sınıfa özel: I8-* yalnız 8. sınıfta geçerli, 7. sınıfta düşer", () => {
    const makeRaw = (): RawParsedExam => ({
      examName: "K",
      examDate: "2026-01-01",
      score: "400",
      subjects: six({
        "T.C. İnkılap Tarihi": {
          name: "T.C. İnkılap Tarihi",
          correct: 10,
          incorrect: 0,
          blank: 0,
          kazanimlar: [{ code: "I8-01", correct: 3, incorrect: 0, blank: 0 }],
        },
      }),
    });
    const g8 = normalizeImportedExam(makeRaw(), 8);
    expect(subj(g8.initial, "T.C. İnkılap Tarihi").kazanimlar.map((k) => k.code)).toEqual(
      ["I8-01"],
    );
    const g7 = normalizeImportedExam(makeRaw(), 7);
    expect(subj(g7.initial, "T.C. İnkılap Tarihi").kazanimlar).toHaveLength(0);
  });
});
