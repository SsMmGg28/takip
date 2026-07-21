"use server";

import { revalidatePath } from "next/cache";
import { assertStudentAction } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getParentIdsByStudent, notifyUsers } from "@/lib/notifications";
import { getBookSubjects, getBookUnits } from "@/lib/book-catalog";
import {
  currentWeekStart,
  formatWeekRange,
  parseWeekParam,
  todayInIstanbul,
} from "@/lib/week";
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

function readScheduleTimingForm(formData: FormData) {
  const dayOfWeek = Number(formData.get("day_of_week"));
  const startTime = String(formData.get("start_time") ?? "");
  const endTime = String(formData.get("end_time") ?? "");
  const weekStart = parseWeekParam(String(formData.get("week_start") ?? ""));

  if (!startTime || !endTime) throw new Error("Eksik bilgi.");
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    throw new Error("Geçerli bir gün seçmelisin.");
  }
  if (endTime <= startTime) {
    throw new Error("Bitiş saati başlangıç saatinden sonra olmalı.");
  }
  if (weekStart < currentWeekStart()) {
    throw new Error("Geçmiş haftanın programı düzenlenemez; arşiv salt okunur.");
  }

  return { dayOfWeek, startTime, endTime, weekStart };
}

function getDurationMinutes(startTime: string, endTime: string): number {
  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    if (
      !Number.isInteger(hours) ||
      !Number.isInteger(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      throw new Error("Program saatleri geçerli değil.");
    }
    return hours * 60 + minutes;
  };

  const duration = toMinutes(endTime) - toMinutes(startTime);
  if (duration <= 0 || duration > 1440) {
    throw new Error("Programdaki başlangıç ve bitiş saatleri geçerli değil.");
  }
  return duration;
}

function readScheduleEntryForm(formData: FormData) {
  const activityLabel = String(formData.get("activity_label") ?? "").trim();
  if (!activityLabel) throw new Error("Etkinlik adı girilmeli.");
  return { ...readScheduleTimingForm(formData), activityLabel };
}

async function readOwnScheduleEntryForm(
  formData: FormData,
  studentId: string,
  admin: ReturnType<typeof createAdminClient>,
) {
  const { dayOfWeek, startTime, endTime, weekStart } = readScheduleTimingForm(formData);
  const subject = String(formData.get("subject") ?? "").trim();
  const kazanimCode = String(formData.get("kazanim_code") ?? "").trim() || null;
  if (!subject) throw new Error("Ders seçilmeli.");

  const { data: studentProfile, error: profileError } = await admin
    .from("student_profiles")
    .select("grade_level")
    .eq("id", studentId)
    .single();
  if (profileError) throw new Error(profileError.message);

  const grade = Number(studentProfile?.grade_level);
  if (!getBookSubjects(grade).includes(subject)) {
    throw new Error("Sınıf düzeyine uygun bir ders seçmelisin.");
  }

  const kazanim = kazanimCode
    ? getBookUnits(grade, subject).find((unit) => unit.code === kazanimCode)
    : null;
  if (kazanimCode && !kazanim) {
    throw new Error("Seçilen kazanım bu ders için geçerli değil.");
  }

  return {
    dayOfWeek,
    startTime,
    endTime,
    weekStart,
    subject,
    kazanimCode: kazanim?.code ?? null,
    kazanimName: kazanim?.name ?? null,
    activityLabel: kazanim ? `${subject} — ${kazanim.name}` : subject,
  };
}

export async function createScheduleEntry(formData: FormData) {
  const userId = await requireEditorRole();
  const supabase = await createClient();

  const studentId = String(formData.get("student_id"));
  const { dayOfWeek, startTime, endTime, activityLabel, weekStart } =
    readScheduleEntryForm(formData);

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

/** Öğretmen veya bağlı veli, erişebildiği mevcut/gelecek program kaydını düzenler. */
export async function updateScheduleEntry(formData: FormData) {
  const userId = await requireEditorRole();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const { data: entry } = await supabase
    .from("study_schedule_entries")
    .select("id, student_id, week_start")
    .eq("id", id)
    .single();
  if (!entry) throw new Error("Program kaydı bulunamadı.");
  if (entry.week_start < currentWeekStart()) {
    throw new Error("Geçmiş haftanın programı düzenlenemez; arşiv salt okunur.");
  }
  const details = readScheduleEntryForm(formData);
  const { error } = await supabase
    .from("study_schedule_entries")
    .update({
      day_of_week: details.dayOfWeek,
      start_time: details.startTime,
      end_time: details.endTime,
      activity_label: details.activityLabel,
      updated_by: userId,
    })
    .eq("id", entry.id);
  if (error) throw new Error(error.message);
  revalidateSchedulePaths(entry.student_id);
}

/** Öğrenci yalnız kendi programına, mevcut veya gelecek hafta için kayıt ekler. */
export async function createOwnScheduleEntry(formData: FormData) {
  const student = await assertStudentAction();
  const admin = createAdminClient();
  const {
    dayOfWeek,
    startTime,
    endTime,
    activityLabel,
    weekStart,
    subject,
    kazanimCode,
    kazanimName,
  } = await readOwnScheduleEntryForm(formData, student.id, admin);

  // İstemciden öğrenci kimliği alınmaz; service-role yalnız doğrulanmış oturum
  // sahibinin kaydını oluşturmak için kullanılır.
  const { error } = await admin.from("study_schedule_entries").insert({
    student_id: student.id,
    day_of_week: dayOfWeek,
    start_time: startTime,
    end_time: endTime,
    activity_label: activityLabel,
    subject,
    kazanim_code: kazanimCode,
    kazanim_name: kazanimName,
    week_start: weekStart,
    updated_by: student.id,
  });
  if (error) throw new Error(error.message);

  revalidateSchedulePaths(student.id);
}

/** Öğrenci yalnız kendi mevcut/gelecek haftadaki program kaydını düzenler. */
export async function updateOwnScheduleEntry(formData: FormData) {
  const student = await assertStudentAction();
  const admin = createAdminClient();
  const id = String(formData.get("id") ?? "");

  const { data: entry, error: entryError } = await admin
    .from("study_schedule_entries")
    .select("id, week_start, completion_log_id")
    .eq("id", id)
    .eq("student_id", student.id)
    .single();
  if (entryError) throw new Error(entryError.message);
  if (!entry) throw new Error("Program kaydı bulunamadı.");
  if (entry.week_start < currentWeekStart()) {
    throw new Error("Geçmiş haftanın programı düzenlenemez; arşiv salt okunur.");
  }

  const details = await readOwnScheduleEntryForm(formData, student.id, admin);
  const { error } = await admin
    .from("study_schedule_entries")
    .update({
      day_of_week: details.dayOfWeek,
      start_time: details.startTime,
      end_time: details.endTime,
      activity_label: details.activityLabel,
      subject: details.subject,
      kazanim_code: details.kazanimCode,
      kazanim_name: details.kazanimName,
      updated_by: student.id,
    })
    .eq("id", entry.id)
    .eq("student_id", student.id);
  if (error) throw new Error(error.message);

  // Tamamlanmış kaydın ders/kazanım seçimi değişirse döküm de aynı bilgiyi
  // göstermeye devam eder; süre ve günlüğe girilen dakika korunur.
  if (entry.completion_log_id) {
    const { error: logError } = await admin
      .from("study_log")
      .update({ subject: details.subject, topic: details.kazanimName })
      .eq("id", entry.completion_log_id)
      .eq("student_id", student.id);
    if (logError) throw new Error(logError.message);
    revalidatePath("/student");
    revalidatePath("/student/gunluk");
    revalidatePath("/student/gunluk/dokum");
  }

  revalidateSchedulePaths(student.id);
}

/** Öğrenci kendi mevcut/gelecek haftadaki program kaydını siler. */
export async function deleteOwnScheduleEntry(formData: FormData) {
  const student = await assertStudentAction();
  const admin = createAdminClient();
  const id = String(formData.get("id") ?? "");

  const { data: entry, error: entryError } = await admin
    .from("study_schedule_entries")
    .select("id, week_start")
    .eq("id", id)
    .eq("student_id", student.id)
    .single();
  if (entryError) throw new Error(entryError.message);
  if (!entry) throw new Error("Program kaydı bulunamadı.");
  if (entry.week_start < currentWeekStart()) {
    throw new Error("Geçmiş haftanın programı düzenlenemez; arşiv salt okunur.");
  }

  const { error } = await admin
    .from("study_schedule_entries")
    .delete()
    .eq("id", entry.id)
    .eq("student_id", student.id);
  if (error) throw new Error(error.message);

  revalidateSchedulePaths(student.id);
}

/** Tamamlanan planı çalışma günlüğüne aktarır; böylece seri ve döküm güncellenir. */
export async function completeOwnScheduleEntry(formData: FormData) {
  const student = await assertStudentAction();
  const admin = createAdminClient();
  const id = String(formData.get("id") ?? "");
  const rawQuestionCount = String(formData.get("question_count") ?? "").trim();
  let questionCount: number | null = null;
  if (rawQuestionCount) {
    const value = Number(rawQuestionCount);
    if (!Number.isFinite(value) || value < 0 || value > 2000) {
      throw new Error("Soru sayısı 0-2000 arasında olmalı.");
    }
    questionCount = Math.round(value);
  }

  const { data: entry, error: entryError } = await admin
    .from("study_schedule_entries")
    .select("id, week_start, start_time, end_time, subject, kazanim_name, completed_at")
    .eq("id", id)
    .eq("student_id", student.id)
    .single();
  if (entryError) throw new Error(entryError.message);
  if (!entry) throw new Error("Program kaydı bulunamadı.");
  if (entry.week_start < currentWeekStart()) {
    throw new Error("Geçmiş haftanın programı tamamlanamaz; arşiv salt okunur.");
  }
  if (entry.completed_at) throw new Error("Bu çalışma zaten tamamlandı.");
  if (!entry.subject) throw new Error("Önce kaydı ders seçerek düzenlemelisin.");
  const minutes = getDurationMinutes(entry.start_time, entry.end_time);

  const { data: log, error: logError } = await admin
    .from("study_log")
    .insert({
      student_id: student.id,
      log_date: todayInIstanbul(),
      subject: entry.subject,
      topic: entry.kazanim_name,
      minutes,
      question_count: questionCount,
      note: "Çalışma programından tamamlandı.",
      marked_by: student.id,
    })
    .select("id")
    .single();
  if (logError) throw new Error(logError.message);
  if (!log) throw new Error("Çalışma kaydı oluşturulamadı.");

  const { error } = await admin
    .from("study_schedule_entries")
    .update({
      completed_at: new Date().toISOString(),
      completion_log_id: log.id,
      updated_by: student.id,
    })
    .eq("id", entry.id)
    .eq("student_id", student.id);
  if (error) throw new Error(error.message);

  revalidateSchedulePaths(student.id);
  revalidatePath("/student");
  revalidatePath("/student/gunluk");
  revalidatePath("/student/gunluk/dokum");
}

/** Aynı İstanbul gününde tamamlanan programı ve bağlı günlüğü tek transaction ile geri alır. */
export async function undoOwnScheduleCompletion(formData: FormData) {
  const student = await assertStudentAction();
  const entryId = String(formData.get("id") ?? "");
  if (!entryId) throw new Error("Program kaydı bulunamadı.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("undo_own_schedule_completion", {
    p_entry_id: entryId,
  });
  if (error) throw new Error(error.message);

  revalidateSchedulePaths(student.id);
  revalidatePath("/student");
  revalidatePath("/student/gunluk");
  revalidatePath("/student/gunluk/dokum");
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
      subject: e.subject,
      kazanim_code: e.kazanim_code,
      kazanim_name: e.kazanim_name,
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

/** Öğrenci kendi haftalık programının otomatik devam tercihini günceller. */
export async function setOwnScheduleAutoRepeat(enabled: boolean) {
  const student = await assertStudentAction();
  const admin = createAdminClient();

  // İstemciden öğrenci kimliği alınmaz: yalnız doğrulanmış oturum sahibinin
  // ayarı, dar bir service-role güncellemesiyle değiştirilebilir.
  const { data: updated, error } = await admin
    .from("student_profiles")
    .update({ schedule_auto_repeat: enabled })
    .eq("id", student.id)
    .select("id");
  if (error) throw new Error(error.message);
  if (!updated?.length) throw new Error("Otomatik devam ayarı güncellenemedi.");

  revalidateSchedulePaths(student.id);
  revalidatePath("/student/profile");
}
