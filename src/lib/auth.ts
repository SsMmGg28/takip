import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Role } from "@/lib/types";

// cache(): aynı istek içinde layout ve sayfa requireRole()'ü ayrı ayrı çağırdığında
// getUser + profiles sorguları bir kez çalışır.
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
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
