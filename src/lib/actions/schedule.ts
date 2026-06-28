"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createScheduleEntry(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Yetkisiz.");

  const studentId = String(formData.get("student_id"));
  const dayOfWeek = Number(formData.get("day_of_week"));
  const startTime = String(formData.get("start_time"));
  const endTime = String(formData.get("end_time"));
  const activityLabel = String(formData.get("activity_label") ?? "").trim();
  const redirectPath = String(formData.get("redirect_path"));

  if (!activityLabel || !startTime || !endTime) throw new Error("Eksik bilgi.");

  await supabase.from("study_schedule_entries").insert({
    student_id: studentId,
    day_of_week: dayOfWeek,
    start_time: startTime,
    end_time: endTime,
    activity_label: activityLabel,
    updated_by: userData.user.id,
  });

  revalidatePath(redirectPath);
}

export async function deleteScheduleEntry(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const redirectPath = String(formData.get("redirect_path"));

  await supabase.from("study_schedule_entries").delete().eq("id", id);

  revalidatePath(redirectPath);
}
