import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Role } from "@/lib/types";

// cache(): aynı istek içinde layout ve sayfa requireRole()'ü ayrı ayrı çağırdığında
// getUser + profiles sorguları bir kez çalışır.
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  // getClaims: asimetrik JWT anahtarında yerel doğrulama (Auth sunucusuna
  // gidiş-dönüş yok); simetrik anahtarda getUser gibi sunucuya düşer.
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return profile as Profile | null;
});

/** Sayfa düzeyinde rol koruması. Beklenen rollerden biri değilse uygun yere yönlendirir. */
export async function requireRole(allowed: Role[]): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.must_change_password) redirect("/set-password");
  if (!allowed.includes(profile.role)) redirect(`/${profile.role}`);
  return profile;
}

/**
 * Server action koruması: oturum + öğretmen rolü gerektirir; aksi hâlde
 * fırlatır (istemciler mesajı toast ile gösterir). RLS'e ek, kod içi savunma.
 */
export async function assertTeacherAction(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Yetkisiz.");
  if (profile.role !== "teacher") throw new Error("Bu işlemi yalnızca öğretmen yapabilir.");
  return profile;
}
