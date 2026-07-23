"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/exams";
import { isThemeColor } from "@/lib/theme-colors";

/** Kullanıcının kendi ad/telefon bilgisini güncellemesi (yalnızca kendi satırı). */
export async function updateOwnProfile(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, error: "Yetkisiz." };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  if (!fullName) return { ok: false, error: "Ad soyad boş olamaz." };
  if (fullName.length > 100) return { ok: false, error: "Ad soyad çok uzun." };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone })
    .eq("id", userData.user.id);
  if (error) return { ok: false, error: error.message };

  refresh();
  return { ok: true };
}

/**
 * Kullanıcının kendi tema (aksan) rengini güncellemesi. DB'de tutulduğundan seçim
 * tüm cihazlarda senkron olur. Yalnız kendi satırını değiştirir; `theme_color`
 * ayrıcalıklı bir alan olmadığından RLS + profil ayrıcalık trigger'ı buna izin verir.
 */
export async function updateOwnThemeColor(color: string): Promise<ActionResult> {
  if (!isThemeColor(color)) return { ok: false, error: "Geçersiz tema rengi." };

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, error: "Yetkisiz." };

  const { error } = await supabase
    .from("profiles")
    .update({ theme_color: color })
    .eq("id", userData.user.id);
  if (error) return { ok: false, error: error.message };

  refresh();
  return { ok: true };
}
