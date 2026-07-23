/**
 * Kullanıcı seçebildiği tema renkleri (light/dark ekseninden bağımsız aksan ekseni).
 * Kaynak gerçeği `profiles.theme_color`; UI, server action ve tip bu modülü paylaşır.
 * Supabase'siz saf modül — testlenebilir.
 *
 * Renk tonlarının kendisi `src/app/globals.css` içindeki `[data-color="..."]`
 * bloklarında tanımlıdır. Buradaki `swatch`, yalnız profil seçicisindeki önizleme
 * noktası içindir ve o bloklardaki açık tema `--primary` değeriyle uyumlu tutulur.
 */
export const THEME_COLORS = [
  { value: "blue", label: "Mavi", swatch: "oklch(0.52 0.19 252)" },
  { value: "green", label: "Yeşil", swatch: "oklch(0.55 0.14 152)" },
  { value: "purple", label: "Mor", swatch: "oklch(0.52 0.2 295)" },
  { value: "rose", label: "Gül", swatch: "oklch(0.55 0.19 12)" },
  { value: "orange", label: "Turuncu", swatch: "oklch(0.55 0.15 48)" },
] as const;

export type ThemeColor = (typeof THEME_COLORS)[number]["value"];

/** İzinli renk değerleri; check constraint ve doğrulama ile aynı küme. */
export const THEME_COLOR_VALUES = THEME_COLORS.map(
  (c) => c.value,
) as readonly ThemeColor[];

/** Varsayılan tema rengi (mevcut mavi). */
export const DEFAULT_THEME_COLOR: ThemeColor = "blue";

/** Verilen değerin geçerli bir tema rengi olup olmadığını daraltan tip koruması. */
export function isThemeColor(value: unknown): value is ThemeColor {
  return (
    typeof value === "string" && (THEME_COLOR_VALUES as readonly string[]).includes(value)
  );
}
