// LGS puan projeksiyonu: SAF, deterministik yardımcılar (supabase importsuz).
//
// Gerçek LGS puanı ülke geneli veriyle standardize edildiğinden birebir
// hesaplanamaz. Bunun yerine öğrencinin KENDİ geçmiş (net, puan) çiftlerinden
// doğrusal bir ilişki (score ≈ a·net + b) çıkarıp "tahmini" olarak kullanırız.

export interface FitLine {
  /** Net başına puan (eğim). */
  a: number;
  b: number;
}

/**
 * En küçük kareler ile score ≈ a·net + b uydurur. Puanı olan en az 2 deneme
 * gerekir; tüm netler aynıysa (belirsiz eğim) null döner.
 */
export function fitScorePerNet(
  rows: { totalNet: number; score: number | null }[],
): FitLine | null {
  const pts = rows.filter(
    (r): r is { totalNet: number; score: number } => typeof r.score === "number",
  );
  if (pts.length < 2) return null;

  const n = pts.length;
  const sx = pts.reduce((s, p) => s + p.totalNet, 0);
  const sy = pts.reduce((s, p) => s + p.score, 0);
  const sxx = pts.reduce((s, p) => s + p.totalNet * p.totalNet, 0);
  const sxy = pts.reduce((s, p) => s + p.totalNet * p.score, 0);

  const denom = n * sxx - sx * sx;
  if (denom === 0) return null; // tüm netler aynı → eğim belirsiz

  const a = (n * sxy - sx * sy) / denom;
  const b = (sy - a * sx) / n;
  return { a, b };
}

/**
 * Bir kazanımdaki yanlış+boş doğruya çevrilirse net kazancı (Δnet).
 * Net = doğru − yanlış/4 olduğundan:
 *   - yanlış → doğru: +1 doğru, −1 yanlış ⇒ +1.25 net
 *   - boş → doğru:    +1 doğru           ⇒ +1 net
 */
export function simulateKazanimGain(k: { incorrect: number; blank: number }): number {
  return 1.25 * k.incorrect + k.blank;
}

/** Δnet'i tahmini puana çevirir (net başına puan biliniyorsa). */
export function estimateScoreGain(
  deltaNet: number,
  puanPerNet: number | null,
): number | null {
  if (puanPerNet == null || puanPerNet <= 0) return null;
  return deltaNet * puanPerNet;
}
