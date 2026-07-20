import {
  LGS_SUBJECTS,
  getKazanimlar,
  type SubjectName,
  type ExamGrade,
} from "@/lib/kazanim";
import type { ExamFormInitial } from "@/components/exams/exam-entry-form";

// Gemini'den gelen ham JSON'u mevcut deneme formunun beklediği ExamFormInitial
// yapısına çeviren SAF/deterministik katman. Ders adlarını kanonik LGS
// adlarına eşler, boş sayısını gerekiyorsa hesaplar, puan/tarih/ad'ı normalize
// eder ve doğrulanamayan noktalar için uyarı üretir. Kazanım eşleştirme
// (Faz 2, opsiyonel): Gemini katalog kodlarını döndürürse yalnızca geçerli
// kodlar kabul edilir; aksi halde kazanimlar boş kalır.

export interface RawParsedKazanim {
  code?: unknown;
  correct?: unknown;
  incorrect?: unknown;
  blank?: unknown;
}

export interface RawParsedSubject {
  name?: unknown;
  correct?: unknown;
  incorrect?: unknown;
  blank?: unknown;
  kazanimlar?: unknown;
}

export interface RawParsedExam {
  examName?: unknown;
  examDate?: unknown;
  score?: unknown;
  subjects?: unknown;
}

export interface NormalizedImport {
  initial: ExamFormInitial;
  warnings: string[];
}

/** Türkçe karakterleri sadeleştirip aksan/noktalama duyarsız karşılaştırma anahtarı üretir. */
function slug(value: string): string {
  return value
    .replace(/İ/g, "I")
    .replace(/ı/g, "i")
    .toLowerCase()
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Belgede geçen bir ders adını 6 kanonik LGS dersinden birine eşler.
 * "LGS-" öneki, "ve Atatürkçülük/Ahlak Bilgisi" gibi ekler ve "Yabancı Dil"
 * (=İngilizce) / 7. sınıf "Sosyal Bilgiler" (=İnkılap yuvası) varyantları tolere edilir.
 */
export function matchCanonicalSubject(raw: string): SubjectName | null {
  const s = slug(raw);
  if (!s) return null;
  if (s.includes("turkce")) return "Türkçe";
  if (s.includes("matematik")) return "Matematik";
  if (s.includes("fen")) return "Fen Bilimleri";
  if (s.includes("ingilizce") || s.includes("yabanci")) return "İngilizce";
  if (s.includes("inkilap") || s.includes("sosyal") || s.includes("ataturk"))
    return "T.C. İnkılap Tarihi";
  if (s.includes("din")) return "Din Kültürü";
  return null;
}

/** Negatif olmayan tam sayıya zorlar; geçersizse null. */
function toCount(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value.trim()) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  const i = Math.round(n);
  return i >= 0 ? i : null;
}

/** Türkçe ondalıklı puanı (ör. "494,51" veya "462,700") 0..500 sayısına çevirir. */
function parseScore(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return clampScore(value);
  }
  if (typeof value !== "string") return null;
  let t = value.trim();
  if (!t) return null;
  // Yalnız rakam, nokta ve virgül bırak.
  t = t.replace(/[^0-9.,]/g, "");
  if (!t) return null;
  // Türk biçimi: virgül ondalık ayıracı; binlik nokta olası. Son ayıracı ondalık say.
  if (t.includes(",")) {
    t = t.replace(/\./g, "").replace(",", ".");
  }
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return clampScore(n);
}

function clampScore(n: number): number | null {
  if (n < 0) return null;
  if (n > 500) return 500;
  return Math.round(n * 100) / 100;
}

/** "AD(AD)" gibi parantez tekrarını temizler ve sadeleştirir. */
function cleanExamName(value: unknown): string {
  if (typeof value !== "string") return "";
  let name = value.trim();
  // Sondaki parantezli tekrarı at: "X (X)" / "X(X)".
  const m = name.match(/^(.*?)\s*\((.*)\)\s*$/);
  if (m) {
    const before = m[1].trim();
    const inside = m[2].trim();
    if (
      before &&
      (before === inside || inside.startsWith(before) || before.startsWith(inside))
    ) {
      name = before;
    }
  }
  return name.replace(/\s+/g, " ").trim();
}

/** Tarihi ISO (YYYY-MM-DD) biçimine çevirir; DD.MM.YYYY ve ISO'yu destekler. */
function parseDate(value: unknown): string {
  if (typeof value !== "string") return "";
  const t = value.trim();
  if (!t) return "";
  // Zaten ISO ise.
  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  // DD.MM.YYYY veya D.M.YYYY (nokta/eğik çizgi ayraç).
  const dmy = t.match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/);
  if (dmy) {
    const dd = dmy[1].padStart(2, "0");
    const mm = dmy[2].padStart(2, "0");
    return `${dmy[3]}-${mm}-${dd}`;
  }
  return "";
}

interface KazanimRow {
  code: string;
  correct: number;
  incorrect: number;
  blank: number;
}

/**
 * Bir dersin ham kazanımlarını (Gemini'nin atadığı katalog kodları) doğrular ve
 * forma uygun satırlara çevirir: yalnızca o sınıf+ders için geçerli katalog
 * kodları kabul edilir, aynı kod toplanır, D+Y+B=0 satırlar atılır (form ve
 * validatePayload boş satırı reddeder). Kazanım toplamı ders soru sayısını
 * aşarsa (Gemini hatası) o dersin kazanımları enjekte edilmez ve uyarı verilir
 * — böylece kayıt bloklanmaz, kullanıcı elle işaretleyebilir.
 */
function buildKazanimlar(
  grade: ExamGrade,
  subjectName: SubjectName,
  questionCount: number,
  raw: RawParsedKazanim[],
  warnings: string[],
): KazanimRow[] {
  if (raw.length === 0) return [];
  const validCodes = new Set(getKazanimlar(grade, subjectName).map((k) => k.code));
  const byCode = new Map<string, { correct: number; incorrect: number; blank: number }>();
  for (const rk of raw) {
    const code = typeof rk.code === "string" ? rk.code.trim() : "";
    if (!validCodes.has(code)) {
      if (code) warnings.push(`${subjectName}: "${code}" kodu katalogda yok, atlandı.`);
      continue;
    }
    const correct = toCount(rk.correct) ?? 0;
    const incorrect = toCount(rk.incorrect) ?? 0;
    const blank = toCount(rk.blank) ?? 0;
    const cur = byCode.get(code);
    if (cur) {
      cur.correct += correct;
      cur.incorrect += incorrect;
      cur.blank += blank;
    } else {
      byCode.set(code, { correct, incorrect, blank });
    }
  }
  const rows: KazanimRow[] = [...byCode.entries()]
    .filter(([, v]) => v.correct + v.incorrect + v.blank > 0)
    .map(([code, v]) => ({ code, ...v }));
  const kTotal = rows.reduce((s, r) => s + r.correct + r.incorrect + r.blank, 0);
  if (kTotal > questionCount) {
    warnings.push(
      `${subjectName}: kazanım toplamı (${kTotal}) ders soru sayısını (${questionCount}) aşıyor; kazanım eşleştirme atlandı, elle işaretle.`,
    );
    return [];
  }
  return rows;
}

export function normalizeImportedExam(
  raw: RawParsedExam,
  grade: ExamGrade,
): NormalizedImport {
  const warnings: string[] = [];

  // Ham dersleri kanonik ada göre grupla (aynı derse birden çok satır gelirse topla).
  const byCanonical = new Map<
    SubjectName,
    {
      correct: number;
      incorrect: number;
      blank: number | null;
      kazanimlar: RawParsedKazanim[];
    }
  >();
  const rawSubjects = Array.isArray(raw.subjects)
    ? (raw.subjects as RawParsedSubject[])
    : [];
  for (const rs of rawSubjects) {
    const canonical = typeof rs.name === "string" ? matchCanonicalSubject(rs.name) : null;
    if (!canonical) {
      if (typeof rs.name === "string" && rs.name.trim())
        warnings.push(`"${rs.name}" dersi tanınamadı, atlandı.`);
      continue;
    }
    const correct = toCount(rs.correct) ?? 0;
    const incorrect = toCount(rs.incorrect) ?? 0;
    const blank = toCount(rs.blank);
    const kazanimlar = Array.isArray(rs.kazanimlar)
      ? (rs.kazanimlar as RawParsedKazanim[])
      : [];
    const existing = byCanonical.get(canonical);
    if (existing) {
      existing.correct += correct;
      existing.incorrect += incorrect;
      existing.blank = (existing.blank ?? 0) + (blank ?? 0);
      existing.kazanimlar.push(...kazanimlar);
    } else {
      byCanonical.set(canonical, {
        correct,
        incorrect,
        blank,
        kazanimlar: [...kazanimlar],
      });
    }
  }

  const subjects = LGS_SUBJECTS.map((def) => {
    const parsed = byCanonical.get(def.name);
    if (!parsed) {
      warnings.push(`${def.name} belgede bulunamadı; elle girmen gerekebilir.`);
      return { name: def.name, correct: 0, incorrect: 0, blank: 0, kazanimlar: [] };
    }
    let { correct, incorrect } = parsed;
    // Sayı sınırını aşan/uyumsuz değerleri kırp.
    if (correct > def.questionCount) correct = def.questionCount;
    if (incorrect > def.questionCount) incorrect = def.questionCount;

    // Boş: verilmediyse veya toplam tutmuyorsa soru sayısından hesapla.
    let blank = parsed.blank;
    const computedBlank = def.questionCount - correct - incorrect;
    if (blank == null || correct + incorrect + blank !== def.questionCount) {
      blank = computedBlank;
    }
    if (blank < 0) {
      blank = 0;
      warnings.push(
        `${def.name}: doğru+yanlış soru sayısını aşıyor, kontrol et (${correct}D/${incorrect}Y).`,
      );
    }
    if (correct + incorrect + blank !== def.questionCount) {
      warnings.push(`${def.name}: toplam ${def.questionCount} tutmuyor, formda düzelt.`);
    }
    const kazanimlar = buildKazanimlar(
      grade,
      def.name,
      def.questionCount,
      parsed.kazanimlar,
      warnings,
    );
    return { name: def.name, correct, incorrect, blank, kazanimlar };
  });

  const initial: ExamFormInitial = {
    examName: cleanExamName(raw.examName),
    examDate: parseDate(raw.examDate),
    score: parseScore(raw.score),
    subjects,
  };

  if (initial.score == null) warnings.push("Puan okunamadı; elle gir.");
  if (!initial.examDate) warnings.push("Tarih okunamadı; elle gir.");

  return { initial, warnings };
}
