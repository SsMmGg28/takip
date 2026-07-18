"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayInIstanbul } from "@/lib/week";

/**
 * Öğrenci günlük çalışma kaydı ekler (ders + dakika + opsiyonel not). Kayıt her
 * zaman oturum sahibinin kendisine yazılır; RLS (study_log_write_own) yalnız
 * öğrencinin kendisine izin verir (öğretmen/veli salt-okunur).
 */
export async function addStudyLog(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Yetkisiz.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();
  if (profile?.role !== "student") {
    throw new Error("Çalışma kaydını yalnızca öğrenci ekleyebilir.");
  }

  const subject = String(formData.get("subject") ?? "").trim();
  const minutes = Number(formData.get("minutes"));
  const note = String(formData.get("note") ?? "").trim() || null;
  const rawDate = String(formData.get("log_date") ?? "").trim();
  const logDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : todayInIstanbul();

  if (!subject) throw new Error("Ders seçilmeli.");
  if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 1440) {
    throw new Error("Süre 1-1440 dakika arasında olmalı.");
  }

  const { error } = await supabase.from("study_log").insert({
    student_id: userData.user.id,
    log_date: logDate,
    subject,
    minutes: Math.round(minutes),
    note,
    marked_by: userData.user.id,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/student");
  revalidatePath("/student/gunluk");
}

/** Öğrenci kendi çalışma kaydını siler (RLS own-only). */
export async function deleteStudyLog(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const { error } = await supabase.from("study_log").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/student");
  revalidatePath("/student/gunluk");
}
