import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { GuideProgress } from "@/lib/guides";

/** Oturum sahibinin hesaplar arası senkron rehber ilerlemesini getirir. */
export async function getGuideProgress(userId: string): Promise<GuideProgress[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_guide_progress")
    .select("guide_id, version, outcome")
    .eq("user_id", userId);

  // Migration henüz uygulanmamış bir önizleme ortamında paneli kırma; rehber
  // görülmemiş kabul edilir ve kayıt denemesi kullanıcıya ayrıca bildirilir.
  if (error) {
    console.error("Rehber ilerlemesi okunamadı:", error.message);
    return [];
  }

  return (data as GuideProgress[] | null) ?? [];
}
