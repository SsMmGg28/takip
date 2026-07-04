import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

export interface PushPayload {
  title: string;
  body?: string | null;
  link?: string | null;
  tag?: string;
}

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@derstakip.app";

/** VAPID anahtarları tanımlı değilse push sessizce devre dışı kalır. */
export function isPushConfigured(): boolean {
  return Boolean(publicKey && privateKey);
}

let vapidReady = false;
function ensureVapid() {
  if (!vapidReady && isPushConfigured()) {
    webpush.setVapidDetails(subject, publicKey!, privateKey!);
    vapidReady = true;
  }
  return vapidReady;
}

interface StoredSubscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Verilen kullanıcıların tüm cihazlarına web push gönderir. Uygulama içi
 * bildirimin tamamlayıcısıdır; hata olursa loglar, asla fırlatmaz. Artık
 * geçersiz olan abonelikler (410/404) temizlenir.
 */
export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  if (!ensureVapid()) return;
  const unique = Array.from(new Set(userIds)).filter(Boolean);
  if (!unique.length) return;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("user_id", unique);
  if (error) {
    console.error("[push subscriptions select]", error);
    return;
  }

  const subs = (data ?? []) as StoredSubscription[];
  if (!subs.length) return;

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body ?? undefined,
    link: payload.link ?? "/",
    tag: payload.tag,
    icon: "/icon.png",
  });

  const staleIds: string[] = [];
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body,
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          staleIds.push(sub.id);
        } else {
          console.error("[push send]", statusCode, err);
        }
      }
    }),
  );

  if (staleIds.length) {
    await supabase.from("push_subscriptions").delete().in("id", staleIds);
  }
}
