import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUsers } from "@/lib/push";
import type { NotificationType } from "@/lib/types";

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null;
}

/**
 * Verilen kullanıcılara bildirim yazar. Service-role ile çalışır: alıcılar
 * çağıran kullanıcının RLS kapsamı dışında olabilir (ör. veli → öğretmen).
 * Bildirim üretimi asıl işlemi asla bozmasın: hata olursa loglar, fırlatmaz.
 */
export async function notifyUsers(userIds: string[], payload: NotificationPayload) {
  const unique = Array.from(new Set(userIds)).filter(Boolean);
  if (!unique.length) return;

  const supabase = createAdminClient();
  const { error } = await supabase.from("notifications").insert(
    unique.map((userId) => ({
      user_id: userId,
      type: payload.type,
      title: payload.title,
      body: payload.body ?? null,
      link: payload.link ?? null,
    })),
  );
  if (error) console.error("[notifications insert]", error);

  // Kilit ekranına düşen web push — uygulama içi bildirimin tamamlayıcısı.
  try {
    await sendPushToUsers(unique, {
      title: payload.title,
      body: payload.body,
      link: payload.link,
      tag: payload.type,
    });
  } catch (err) {
    console.error("[push notify]", err);
  }
}

/** Öğrencilerin velilerini döner: studentId -> parentId[] */
export async function getParentIdsByStudent(
  studentIds: string[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (!studentIds.length) return map;

  const supabase = createAdminClient();
  const { data: links } = await supabase
    .from("parent_student_links")
    .select("parent_id, student_id")
    .in("student_id", studentIds);

  for (const l of links ?? []) {
    if (!map.has(l.student_id)) map.set(l.student_id, []);
    map.get(l.student_id)!.push(l.parent_id);
  }
  return map;
}

/**
 * Sistemdeki öğretmen hesapları (kitap onayı bildirimleri için).
 * `demo` verilirse yalnız o dünyaya ait öğretmenler döner (demo veli → demo öğretmen,
 * gerçek veli → gerçek öğretmen); verilmezse tüm öğretmenler.
 */
export async function getTeacherIds(opts?: { demo?: boolean }): Promise<string[]> {
  const supabase = createAdminClient();
  let query = supabase.from("profiles").select("id").eq("role", "teacher");
  if (opts?.demo !== undefined) query = query.eq("is_demo", opts.demo);
  const { data } = await query;
  return (data ?? []).map((p) => p.id);
}
