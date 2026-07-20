"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getParentIdsByStudent, notifyUsers } from "@/lib/notifications";
import { currentWeekStart, formatWeekRange, parseWeekParam } from "@/lib/week";
import type { StudyScheduleEntry } from "@/lib/types";

/**
 * Programı yalnızca öğretmen ve veli düzenleyebilir (RLS de engeller; burada
 * öğrenciye anlamlı hata mesajı vermek için ayrıca denetlenir).
 */
async function requireEditorRole(): Promise<string> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Yetkisiz.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();
  if (profile?.role === "student") {
    throw new Error("Programı yalnızca öğretmen ve veli düzenleyebilir.");
  }
  return userData.user.id;
}

function revalidateSchedulePaths(studentId: string) {
  revalidatePath("/student/schedule");
  revalidatePath("/parent/schedule");
  revalidatePath(`/teacher/schedule/${studentId}`);
}

export async function createScheduleEntry(formData: FormData) {
  const userId = await requireEditorRole();
  const supabase = await createClient();

  const studentId = String(formData.get("student_id"));
  const dayOfWeek = Number(formData.get("day_of_week"));
  const startTime = String(formData.get("start_time"));
  const endTime = String(formData.get("end_time"));
  const activityLabel = String(formData.get("activity_label") ?? "").trim();
  const weekStart = parseWeekParam(String(formData.get("week_start") ?? ""));

  if (!activityLabel || !startTime || !endTime) throw new Error("Eksik bilgi.");
  if (weekStart < currentWeekStart()) {
    throw new Error("Geçmiş haftanın programı düzenlenemez; arşiv salt okunur.");
  }

  const { error } = await supabase.from("study_schedule_entries").insert({
    student_id: studentId,
    day_of_week: dayOfWeek,
    start_time: startTime,
    end_time: endTime,
    activity_label: activityLabel,
    week_start: weekStart,
    updated_by: userId,
  });
  if (error) throw new Error(error.message);

  revalidateSchedulePaths(studentId);
}

export async function deleteScheduleEntry(formData: FormData) {
  await requireEditorRole();
  const supabase = await createClient();
  const id = String(formData.get("id"));

  const { data: entry } = await supabase
    .from("study_schedule_entries")
    .select("student_id, week_start")
    .eq("id", id)
    .single();
  if (!entry) return;
  if (entry.week_start < currentWeekStart()) {
    throw new Error("Geçmiş haftanın programı düzenlenemez; arşiv salt okunur.");
  }

  const { error } = await supabase.from("study_schedule_entries").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidateSchedulePaths(entry.student_id);
}

/**
 * Arşivdeki bir haftayı güncel haftaya kopyalar (mevcut hafta silinip
 * yerine yazılır — tek tıkla "geri getir/değiştir").
 */
export async function copyWeekToCurrent(formData: FormData) {
  const userId = await requireEditorRole();
  const supabase = await createClient();

  const studentId = String(formData.get("student_id"));
  const fromWeek = parseWeekParam(String(formData.get("from_week") ?? ""));
  const target = currentWeekStart();
  if (fromWeek === target) throw new Error("Bu hafta zaten görüntülenen hafta.");

  const { data: source } = await supabase
    .from("study_schedule_entries")
    .select("*")
    .eq("student_id", studentId)
    .eq("week_start", fromWeek);
  const entries = (source as StudyScheduleEntry[] | null) ?? [];
  if (!entries.length) throw new Error("Kopyalanacak hafta boş.");

  const { error: deleteError } = await supabase
    .from("study_schedule_entries")
    .delete()
    .eq("student_id", studentId)
    .eq("week_start", target);
  if (deleteError) throw new Error(deleteError.message);

  const { error: insertError } = await supabase.from("study_schedule_entries").insert(
    entries.map((e) => ({
      student_id: studentId,
      day_of_week: e.day_of_week,
      start_time: e.start_time,
      end_time: e.end_time,
      activity_label: e.activity_label,
      week_start: target,
      updated_by: userId,
    })),
  );
  if (insertError) throw new Error(insertError.message);

  revalidateSchedulePaths(studentId);
}

/** Öğretmen/veli programı hazırlayınca öğrenci + veliye tek bildirim gönderir. */
export async function notifyScheduleAssigned(formData: FormData) {
  const senderId = await requireEditorRole();
  const supabase = await createClient();

  const studentId = String(formData.get("student_id"));
  const weekStart = parseWeekParam(String(formData.get("week_start") ?? ""));

  // Erişim denetimi: RLS kapsamında okunabiliyorsa gönderen yetkilidir.
  const { data: entries } = await supabase
    .from("study_schedule_entries")
    .select("id")
    .eq("student_id", studentId)
    .eq("week_start", weekStart)
    .limit(1);
  if (!entries?.length) throw new Error("Bu hafta için program boş; önce etkinlik ekle.");

  const parentsByStudent = await getParentIdsByStudent([studentId]);
  const parentIds = (parentsByStudent.get(studentId) ?? []).filter(
    (id) => id !== senderId,
  );
  const body = `${formatWeekRange(weekStart)} haftası için çalışma programın hazır.`;

  await Promise.all([
    notifyUsers([studentId], {
      type: "schedule_assigned",
      title: "Çalışma programın hazır",
      body,
      link: `/student/schedule?week=${weekStart}`,
    }),
    notifyUsers(parentIds, {
      type: "schedule_assigned",
      title: "Çalışma programı hazırlandı",
      body,
      link: `/parent/schedule?week=${weekStart}`,
    }),
  ]);
}

/** Öğrenci başına "program her hafta otomatik devam etsin" ayarı (öğretmen). */
export async function setScheduleAutoRepeat(formData: FormData) {
  const supabase = await createClient();
  const studentId = String(formData.get("student_id"));
  const enabled = String(formData.get("enabled")) === "true";

  // RLS (student_profiles_write_teacher) yalnızca öğretmene izin verir.
  const { data: updated, error } = await supabase
    .from("student_profiles")
    .update({ schedule_auto_repeat: enabled })
    .eq("id", studentId)
    .select("id");
  if (error) throw new Error(error.message);
  if (!updated?.length) throw new Error("Bu ayarı yalnızca öğretmen değiştirebilir.");

  revalidateSchedulePaths(studentId);
}
