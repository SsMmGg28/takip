"use server";

import { getGuideById, type GuideOutcome } from "@/lib/guides";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export async function saveGuideProgress(input: {
  guideId: string;
  version: number;
  outcome: GuideOutcome;
}): Promise<{ success: true }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("Yetkisiz.");

  const guide = getGuideById(input.guideId);
  if (!guide || guide.version !== input.version) {
    throw new Error("Geçersiz rehber veya sürüm.");
  }
  if (input.outcome !== "completed" && input.outcome !== "skipped") {
    throw new Error("Geçersiz rehber sonucu.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile) throw new Error("Profil bulunamadı.");
  const role = profile.role as Role;
  if (!guide.roles.includes(role) || role === "teacher") {
    throw new Error("Bu rehber hesabınıza uygun değil.");
  }

  const { error } = await supabase.from("user_guide_progress").upsert(
    {
      user_id: user.id,
      guide_id: guide.id,
      version: guide.version,
      outcome: input.outcome,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,guide_id" },
  );
  if (error) throw new Error("Rehber ilerlemesi kaydedilemedi.");
  return { success: true };
}
