const AUTH_EMAIL_DOMAIN = process.env.NEXT_PUBLIC_AUTH_EMAIL_DOMAIN ?? "takip.internal";

/** Supabase Auth e-posta alanı gerektirdiği için kullanıcı adını teknik bir e-postaya çevirir. */
export function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@${AUTH_EMAIL_DOMAIN}`;
}

export function normalizeUsername(fullName: string, suffix?: number) {
  const base = fullName
    .trim()
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .join(".");
  return suffix ? `${base}${suffix}` : base;
}

export function generateTempPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  for (const byte of bytes) {
    result += chars[byte % chars.length];
  }
  return result;
}
