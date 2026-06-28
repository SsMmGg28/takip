"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createCalendarEvent(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Yetkisiz.");

  const studentId = String(formData.get("student_id") ?? "");
  const type = String(formData.get("type"));
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const startAt = String(formData.get("start_at"));

  if (!title || !startAt) throw new Error("Başlık ve tarih gerekli.");

  await supabase.from("calendar_events").insert({
    student_id: studentId || null,
    type,
    title,
    description,
    start_at: new Date(startAt).toISOString(),
    created_by: userData.user.id,
  });

  revalidatePath("/teacher/calendar");
}

export async function deleteCalendarEvent(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("calendar_events").delete().eq("id", id);
  revalidatePath("/teacher/calendar");
}
