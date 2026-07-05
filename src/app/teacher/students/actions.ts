"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Öğretmenin öğrenci hakkındaki özel notunu kaydeder (yalnızca öğretmen görür). */
export async function updateStudentNotes(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Yetkisiz.");

  const studentId = String(formData.get("student_id"));
  const notes = String(formData.get("notes") ?? "").trim() || null;

  // RLS (student_profiles_write_teacher) yalnızca öğretmene izin verir.
  const { data: updated, error } = await supabase
    .from("student_profiles")
    .update({ notes })
    .eq("id", studentId)
    .select("id");
  if (error) throw new Error(error.message);
  if (!updated?.length) throw new Error("Notu yalnızca öğretmen düzenleyebilir.");

  revalidatePath(`/teacher/students/${studentId}`);
}
