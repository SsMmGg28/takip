"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface SubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/**
 * Oturumdaki kullanıcının bu cihaz için push aboneliğini kaydeder.
 * Aynı tarayıcıda farklı bir hesaba geçilmişse endpoint önceki kullanıcıda
 * kayıtlı kalabilir; bu yüzden yazma service-role ile yapılır ve endpoint
 * her zaman aktif kullanıcıya devredilir.
 */
export async function savePushSubscription(sub: SubscriptionInput, userAgent?: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Yetkisiz.");

  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    throw new Error("Geçersiz abonelik verisi.");
  }

  const admin = createAdminClient();
  const { error } = await admin.from("push_subscriptions").upsert(
    {
      user_id: userData.user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      user_agent: userAgent?.slice(0, 300) ?? null,
    },
    { onConflict: "endpoint" },
  );
  if (error) {
    console.error("[push subscription upsert]", error);
    throw new Error("Abonelik kaydedilemedi.");
  }
}

/** Bu cihazın push aboneliğini siler. Endpoint yalnızca bu tarayıcıda bilinir. */
export async function deletePushSubscription(endpoint: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Yetkisiz.");

  // Sahiplik kontrolü: service-role RLS'i atladığı için silmeyi mutlaka
  // çağıran kullanıcının kaydıyla sınırla; aksi halde endpoint'i bilen biri
  // başkasının aboneliğini silebilir.
  const admin = createAdminClient();
  await admin
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("user_id", userData.user.id);
}
