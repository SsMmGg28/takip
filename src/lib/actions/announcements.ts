"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParentIdsByStudent, notifyUsers } from "@/lib/notifications";
import type { AnnouncementAudience, AnnouncementScope } from "@/lib/types";

function revalidateAnnouncementPaths() {
  revalidatePath("/teacher/announcements");
  revalidatePath("/student/announcements");
  revalidatePath("/parent/announcements");
}

/**
 * Duyurunun hedef öğrenci kümesini çözer (service-role: kapsam tüm okul
 * olabilir). Dönen liste bildirim alacak öğrencilerdir; veliler bu listedeki
 * öğrencilerin velileridir.
 */
async function resolveTargetStudents(
  scope: AnnouncementScope,
  gradeLevel: number | null,
  studentIds: string[],
): Promise<string[]> {
  const admin = createAdminClient();
  if (scope === "students") return studentIds;
  if (scope === "grade") {
    const { data } = await admin
      .from("student_profiles")
      .select("id")
      .eq("grade_level", gradeLevel);
    return (data ?? []).map((r) => r.id);
  }
  const { data } = await admin.from("profiles").select("id").eq("role", "student");
  return (data ?? []).map((r) => r.id);
}

/** Duyuru oluşturur, isteğe bağlı belgeyi yükler ve hedef kitleyi bilgilendirir. */
export async function createAnnouncement(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Yetkisiz.");

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const audience = String(formData.get("audience_role") ?? "all") as AnnouncementAudience;
  const scope = String(formData.get("target_scope") ?? "all") as AnnouncementScope;
  const gradeLevel = Number(formData.get("grade_level")) || null;
  const studentIds = formData
    .getAll("student_ids")
    .map((v) => String(v))
    .filter(Boolean);
  const file = formData.get("attachment") as File | null;
  const hasFile = file && file.size > 0;

  if (!title || !body) throw new Error("Başlık ve içerik gerekli.");
  if (scope === "grade" && ![5, 6, 7, 8].includes(Number(gradeLevel)))
    throw new Error("Sınıf düzeyi seçilmeli.");
  if (scope === "students" && studentIds.length === 0)
    throw new Error("En az bir öğrenci seçilmeli.");

  // Yazma kullanıcı istemcisiyle (RLS: yalnızca öğretmen).
  const { data: announcement, error } = await supabase
    .from("announcements")
    .insert({
      title,
      body,
      audience_role: audience,
      target_scope: scope,
      grade_level: scope === "grade" ? gradeLevel : null,
      created_by: userData.user.id,
    })
    .select("id")
    .single();
  if (error || !announcement) throw new Error(error?.message ?? "Duyuru oluşturulamadı.");

  if (scope === "students") {
    const { error: targetError } = await supabase.from("announcement_targets").insert(
      studentIds.map((studentId) => ({
        announcement_id: announcement.id,
        student_id: studentId,
      })),
    );
    if (targetError) {
      await supabase.from("announcements").delete().eq("id", announcement.id);
      throw new Error(targetError.message);
    }
  }

  if (hasFile) {
    const path = `${announcement.id}/${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("announcement-files")
      .upload(path, file, { upsert: true });
    if (uploadError) {
      console.error("[announcement attachment upload]", uploadError);
    } else {
      await supabase
        .from("announcements")
        .update({ attachment_path: path, attachment_name: file.name })
        .eq("id", announcement.id);
    }
  }

  // Bildirimler: hedef öğrenciler + (audience'a göre) velileri.
  const targetStudents = await resolveTargetStudents(
    scope,
    scope === "grade" ? gradeLevel : null,
    studentIds,
  );
  const parentsByStudent = await getParentIdsByStudent(targetStudents);
  const parentIds = targetStudents.flatMap((id) => parentsByStudent.get(id) ?? []);

  const payload = { type: "announcement_created" as const, title: `Yeni duyuru: ${title}` };
  const jobs: Promise<void>[] = [];
  if (audience !== "parents") {
    jobs.push(notifyUsers(targetStudents, { ...payload, link: "/student/announcements" }));
  }
  if (audience !== "students") {
    jobs.push(notifyUsers(parentIds, { ...payload, link: "/parent/announcements" }));
  }
  await Promise.all(jobs);

  revalidateAnnouncementPaths();
}

/** Duyuruyu ve varsa belgesini siler (RLS: yalnızca öğretmen). */
export async function deleteAnnouncement(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));

  const { data: announcement } = await supabase
    .from("announcements")
    .select("attachment_path")
    .eq("id", id)
    .single();
  if (!announcement) return;

  if (announcement.attachment_path) {
    await supabase.storage
      .from("announcement-files")
      .remove([announcement.attachment_path]);
  }
  await supabase.from("announcements").delete().eq("id", id);

  revalidateAnnouncementPaths();
}
