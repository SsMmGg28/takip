"use server";

import { createClient } from "@/lib/supabase/server";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";

export interface PasswordSetupResult {
  ok: boolean;
  role?: string;
  error?: string;
}

/**
 * Kullanıcının ilk giriş / şifre belirleme akışını sunucuda tamamlar.
 * Parola uzunluğu burada zorunlu kılınır (istemci kontrolü atlatılabilir),
 * ardından oturum sahibinin şifresi güncellenir ve must_change_password
 * kapatılır. Yalnızca oturumdaki kullanıcının kendi hesabına etki eder.
 */
export async function completePasswordSetup(
  password: string,
): Promise<PasswordSetupResult> {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı.` };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, error: "Yetkisiz." };

  const { error: updateError } = await supabase.auth.updateUser({ password });
  if (updateError)
    return { ok: false, error: "Şifre güncellenemedi, lütfen tekrar deneyin." };

  const { data: profile } = await supabase
    .from("profiles")
    .update({ must_change_password: false })
    .eq("id", userData.user.id)
    .select("role")
    .single();

  return { ok: true, role: profile?.role ?? undefined };
}
