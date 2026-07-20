// Dosya yükleme doğrulaması ve güvenli depolama adı üretimi. Saf modül:
// server action'lar ve testler tarafından paylaşılır.

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

/** PDF + görsel (deneme belgesi içe aktarma). */
export const PDF_IMAGE_TYPES: ReadonlySet<string> = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

/** PDF + görsel + Word (ödev eki, duyuru belgesi). */
export const ATTACHMENT_TYPES: ReadonlySet<string> = new Set([
  ...PDF_IMAGE_TYPES,
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

// Tarayıcı file.type'ı boş bırakabilir (özellikle heic/doc); uzantıdan tamamla.
const EXTENSION_MIME: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

/** Dosyanın MIME türü: file.type doluysa o, boşsa uzantıdan; bilinmiyorsa null. */
export function resolveMimeType(file: { name: string; type: string }): string | null {
  if (file.type) return file.type;
  const ext = file.name.slice(file.name.lastIndexOf(".") + 1).toLowerCase();
  return EXTENSION_MIME[ext] ?? null;
}

/**
 * Yükleme doğrulaması: geçerliyse null, değilse kullanıcıya gösterilecek
 * Türkçe hata mesajı döner.
 */
export function validateUpload(
  file: { name: string; size: number; type: string },
  opts: { accepted: ReadonlySet<string>; maxBytes?: number; typesLabel?: string },
): string | null {
  const maxBytes = opts.maxBytes ?? MAX_UPLOAD_BYTES;
  if (file.size > maxBytes) {
    return `Dosya çok büyük (en fazla ${Math.floor(maxBytes / (1024 * 1024))} MB).`;
  }
  const mime = resolveMimeType(file);
  if (!mime || !opts.accepted.has(mime)) {
    return `Desteklenmeyen dosya türü (${opts.typesLabel ?? "PDF, görsel veya Word belgesi"} yükleyin).`;
  }
  return null;
}

const TURKISH_MAP: Record<string, string> = {
  ç: "c",
  Ç: "C",
  ğ: "g",
  Ğ: "G",
  ı: "i",
  İ: "I",
  ö: "o",
  Ö: "O",
  ş: "s",
  Ş: "S",
  ü: "u",
  Ü: "U",
};

/**
 * Depolama yoluna güvenli ad üretir: Türkçe karakterler ASCII'ye çevrilir,
 * kalan aksanlar sökülür, `[a-zA-Z0-9._-]` dışı karakterler `_` olur.
 * Orijinal ad veritabanındaki *_name kolonunda saklanmaya devam eder.
 */
export function sanitizeFileName(name: string): string {
  const dot = name.lastIndexOf(".");
  const rawBase = dot > 0 ? name.slice(0, dot) : name;
  const rawExt = dot > 0 ? name.slice(dot + 1) : "";

  const clean = (part: string) =>
    part
      .replace(/[çÇğĞıİöÖşŞüÜ]/g, (ch) => TURKISH_MAP[ch] ?? ch)
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_{2,}/g, "_")
      .replace(/^[._]+|[._]+$/g, "");

  const base = clean(rawBase).slice(0, 80) || "dosya";
  const ext = clean(rawExt).toLowerCase();
  return ext ? `${base}.${ext}` : base;
}
