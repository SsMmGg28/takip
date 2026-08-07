"use server";

import { getCurrentProfile } from "@/lib/auth";
import { getGuideById, type GuideOutcome, type GuideRole } from "@/lib/guides";
import { createClient } from "@/lib/supabase/server";

export interface SaveGuideProgressInput {
  guideId: string;
  version: number;
  outcome: GuideOutcome;
}

export interface SaveGuideProgressResult {
  ok: boolean;
  error?: string;
}

/**
 * Kullanıcı kimliği istemciden alınmaz. Rehber kimliği/sürümü kod tanımıyla,
 * rol de oturum profiliyle doğrulandıktan sonra yalnız kullanıcının satırı yazılır.
 */
export async function saveGuideProgress(
  input: SaveGuideProgressInput,
): Promise<SaveGuideProgressResult> {
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== "student" && profile.role !== "parent")) {
    return { ok: false, error: "Yetkisiz." };
  }

  const guide = getGuideById(input.guideId);
  if (
    !guide ||
    !guide.roles.includes(profile.role as GuideRole) ||
    input.version !== guide.version ||
    (input.outcome !== "completed" && input.outcome !== "skipped")
  ) {
    return { ok: false, error: "Geçersiz rehber bilgisi." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("user_guide_progress").upsert(
    {
      user_id: profile.id,
      guide_id: guide.id,
      version: guide.version,
      outcome: input.outcome,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,guide_id" },
  );

  if (error) return { ok: false, error: "Rehber durumu kaydedilemedi." };
  return { ok: true };
}
