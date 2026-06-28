"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createResourceProgress(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Yetkisiz.");

  const studentId = String(formData.get("student_id"));
  const subject = String(formData.get("subject") ?? "").trim();
  const bookTitle = String(formData.get("book_title") ?? "").trim();
  const progressNote = String(formData.get("progress_note") ?? "").trim() || null;

  if (!subject || !bookTitle) throw new Error("Ders ve kitap adı gerekli.");

  await supabase.from("student_resource_progress").insert({
    student_id: studentId,
    subject,
    book_title: bookTitle,
    progress_note: progressNote,
    updated_by: userData.user.id,
  });

  revalidatePath(`/teacher/resources/${studentId}`);
}

export async function updateResourceStatus(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const id = String(formData.get("id"));
  const studentId = String(formData.get("student_id"));
  const status = String(formData.get("status"));

  await supabase
    .from("student_resource_progress")
    .update({ status, updated_by: userData.user?.id })
    .eq("id", id);

  revalidatePath(`/teacher/resources/${studentId}`);
}

export async function deleteResourceProgress(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const studentId = String(formData.get("student_id"));

  await supabase.from("student_resource_progress").delete().eq("id", id);

  revalidatePath(`/teacher/resources/${studentId}`);
}
