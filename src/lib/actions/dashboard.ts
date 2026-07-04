"use server";

import { createClient } from "@/lib/supabase/server";
import type { StoredLayout } from "@/lib/dashboard-types";

/** Kullanıcının Anasayfa widget yerleşimini kaydeder (cihazlar arası senkron). */
export async function saveDashboardLayout(layout: StoredLayout) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Yetkisiz.");

  const { error } = await supabase.from("dashboard_layouts").upsert({
    user_id: userData.user.id,
    layout,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error("Yerleşim kaydedilemedi.");
}
