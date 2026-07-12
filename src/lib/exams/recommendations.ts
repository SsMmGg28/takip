// Kazanım → kitap önerisi: SAF, deterministik çekirdek (supabase importsuz, test
// edilebilir). Zayıf bir kazanım ve o kazanıma uyan aday kitap bölümleri verilir;
// öğrencinin başarısına göre uygun zorlukta, ÇÖZÜLMEMİŞ bir bölüm seçilir.
//
// Metrik (analizle aynı): başarı s = 1 − (yanlış + 0.5·boş) / soru.
//   - boş, yanlışın yarısı ağırlığında (hep boş → s≈0.5, "nötr/bilinmiyor").
// Hedef zorluk = clamp(round(1 + 4·s), 1, 5): başarı yüksekse zor, düşükse kolay kitap.

/** Öncelik listesinden gelen zayıf kazanım (KazanimPriority ile yapısal uyumlu). */
export interface WeakKazanim {
  subject: string;
  code: string;
  name: string;
  incorrect: number;
  blank: number;
  asked: number;
  priorityScore: number;
}

/** Bir kazanıma uyan aday kitap bölümü + o öğrencinin oradaki durumu. */
export interface CandidateSection {
  sectionId: string;
  sectionName: string;
  bookId: string;
  bookName: string;
  testCount: number;
  /** Kitabın zorluk derecesi (1-5) veya atanmadıysa null. */
  difficulty: number | null;
  /** Öğrencinin bu bölümde çözdüğü test numaraları. */
  solvedTests: Set<number>;
  /** Kitap öğrencinin rafında mı? */
  onShelf: boolean;
}

export interface KazanimRecommendation {
  code: string;
  subject: string;
  name: string;
  asked: number;
  /** Başarı oranı s ∈ [0,1]. */
  successRate: number;
  /** Bu başarıya göre hedeflenen kitap zorluğu (1-5). */
  targetStars: number;
  book: { id: string; name: string } | null;
  section: { id: string; name: string } | null;
  difficulty: number | null;
  /** Seçilen bölümün durumu; kitap yoksa null. */
  status: "unsolved" | "partial" | null;
  /** Ödev olarak önerilen (çözülmemiş) test numaraları — en çok 5. */
  suggestedTests: number[];
  onShelf: boolean;
  /** Kitap seçilemediyse nedeni: hiç aday yok / tüm adaylar bitmiş. */
  reason?: "no-book" | "all-solved";
}

/** Başarı oranı s = 1 − (yanlış + 0.5·boş)/soru, [0,1] aralığına sıkıştırılır. */
export function successRate(k: { incorrect: number; blank: number; asked: number }): number {
  if (k.asked <= 0) return 1;
  const errorRate = (k.incorrect + 0.5 * k.blank) / k.asked;
  return Math.max(0, Math.min(1, 1 - errorRate));
}

/** Hedef kitap zorluğu (1-5): başarı arttıkça artar. */
export function targetDifficulty(s: number): number {
  return Math.min(5, Math.max(1, Math.round(1 + 4 * s)));
}

const MAX_SUGGESTED_TESTS = 5;

/**
 * Bir zayıf kazanım için en uygun (çözülmemiş, hedefe yakın zorlukta) kitap
 * bölümünü seçer. Öncelik sırası:
 *   1) hiç çözülmemiş > yarım kalmış
 *   2) zorluğu hedefe en yakın (derecesizler en sona)
 *   3) öğrencinin rafındaki kitap önce
 *   4) deterministik ad/kimlik sıralaması
 * Tamamen çözülmüş bölümler elenir. Uygun bölüm yoksa reason döner.
 */
export function pickRecommendation(
  kazanim: WeakKazanim,
  candidates: CandidateSection[],
): KazanimRecommendation {
  const s = successRate(kazanim);
  const stars = targetDifficulty(s);
  const base = {
    code: kazanim.code,
    subject: kazanim.subject,
    name: kazanim.name,
    asked: kazanim.asked,
    successRate: s,
    targetStars: stars,
  };

  const usable = candidates.filter((c) => c.solvedTests.size < c.testCount);
  if (usable.length === 0) {
    return {
      ...base,
      book: null,
      section: null,
      difficulty: null,
      status: null,
      suggestedTests: [],
      onShelf: false,
      reason: candidates.length > 0 ? "all-solved" : "no-book",
    };
  }

  const dist = (c: CandidateSection) =>
    c.difficulty == null ? Number.POSITIVE_INFINITY : Math.abs(c.difficulty - stars);

  const chosen = [...usable].sort((a, b) => {
    const aUnsolved = a.solvedTests.size === 0 ? 0 : 1;
    const bUnsolved = b.solvedTests.size === 0 ? 0 : 1;
    if (aUnsolved !== bUnsolved) return aUnsolved - bUnsolved;

    const dd = dist(a) - dist(b);
    if (dd !== 0) return dd;

    if (a.onShelf !== b.onShelf) return a.onShelf ? -1 : 1;

    return (
      a.bookName.localeCompare(b.bookName, "tr") ||
      a.sectionId.localeCompare(b.sectionId)
    );
  })[0];

  const suggestedTests: number[] = [];
  for (let n = 1; n <= chosen.testCount && suggestedTests.length < MAX_SUGGESTED_TESTS; n++) {
    if (!chosen.solvedTests.has(n)) suggestedTests.push(n);
  }

  return {
    ...base,
    book: { id: chosen.bookId, name: chosen.bookName },
    section: { id: chosen.sectionId, name: chosen.sectionName },
    difficulty: chosen.difficulty,
    status: chosen.solvedTests.size === 0 ? "unsolved" : "partial",
    suggestedTests,
    onShelf: chosen.onShelf,
  };
}
