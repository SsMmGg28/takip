// Gömülü yönetici hesabını oluşturur. Bir kez çalıştırılır:
//   node --env-file=.env.local scripts/create-admin.mjs
// Gerekli env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// (opsiyonel: NEXT_PUBLIC_AUTH_EMAIL_DOMAIN)
//
// Hesap role='teacher' + is_admin=true olarak açılır; öğretmen arayüzünün
// tamamını kullanır, ek olarak öğretmen şifresi sıfırlama gibi yönetici
// yetkilerine sahiptir. is_admin bayrağı yalnızca service-role ile
// değiştirilebilir (bkz. supabase/migrations/0010_admin_flag.sql).

import { createClient } from "@supabase/supabase-js";
import { randomInt } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY env değişkenleri gerekli.\n" +
      "Çalıştırma: node --env-file=.env.local scripts/create-admin.mjs",
  );
  process.exit(1);
}

const USERNAME = "admin";
const FULL_NAME = "Yönetici";
const emailDomain = process.env.NEXT_PUBLIC_AUTH_EMAIL_DOMAIN ?? "takip.internal";
const email = `${USERNAME}@${emailDomain}`;

// src/lib/username.ts generateTempPassword ile aynı mantık (belirsiz karakterler yok).
function generateTempPassword() {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += alphabet[randomInt(alphabet.length)];
  return out;
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: existing } = await admin
  .from("profiles")
  .select("id, is_admin")
  .eq("username", USERNAME)
  .maybeSingle();

if (existing) {
  if (existing.is_admin) {
    console.log(`"${USERNAME}" hesabı zaten var ve yönetici. Yapılacak bir şey yok.`);
  } else {
    const { error } = await admin
      .from("profiles")
      .update({ is_admin: true })
      .eq("id", existing.id);
    if (error) {
      console.error("is_admin bayrağı güncellenemedi:", error.message);
      process.exit(1);
    }
    console.log(`"${USERNAME}" hesabı vardı; yönetici bayrağı eklendi.`);
  }
  process.exit(0);
}

const tempPassword = generateTempPassword();

const { data: created, error: createError } = await admin.auth.admin.createUser({
  email,
  password: tempPassword,
  email_confirm: true,
});
if (createError || !created?.user) {
  console.error("Auth kullanıcısı oluşturulamadı:", createError?.message);
  process.exit(1);
}

const { error: profileError } = await admin.from("profiles").insert({
  id: created.user.id,
  role: "teacher",
  is_admin: true,
  username: USERNAME,
  full_name: FULL_NAME,
  must_change_password: true,
});
if (profileError) {
  await admin.auth.admin.deleteUser(created.user.id);
  console.error("Profil oluşturulamadı, işlem geri alındı:", profileError.message);
  process.exit(1);
}

console.log("Yönetici hesabı oluşturuldu:");
console.log(`  Kullanıcı adı : ${USERNAME}`);
console.log(`  Geçici şifre  : ${tempPassword}`);
console.log("İlk girişte şifre değiştirme zorunludur.");
