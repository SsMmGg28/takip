"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createHomework(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Yetkisiz.");

  const studentId = String(formData.get("student_id"));
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const dueDate = String(formData.get("due_date") ?? "") || null;

  if (!title) throw new Error("Başlık gerekli.");

  await supabase.from("homework").insert({
    student_id: studentId,
    title,
    description,
    due_date: dueDate,
    created_by: userData.user.id,
  });

  revalidatePath(`/teacher/homework/${studentId}`);
}

export async function updateHomeworkStatus(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const studentId = String(formData.get("student_id"));
  const status = String(formData.get("status"));

  await supabase.from("homework").update({ status }).eq("id", id);

  revalidatePath(`/teacher/homework/${studentId}`);
}

export async function deleteHomework(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const studentId = String(formData.get("student_id"));

  await supabase.from("homework").delete().eq("id", id);

  revalidatePath(`/teacher/homework/${studentId}`);
}
