"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Homework } from "@/lib/types";

/**
 * Öğrencinin işaretleyebilmesi için ödevin kendisine ait ve henüz kontrol
 * edilmemiş olması gerekir. Yazma, RLS'te öğrenciye yazma izni açmamak için
 * sahiplik doğrulamasından sonra service-role ile yapılır (bildirim
 * eklerindeki desenle aynı).
 */
async function requireOwnUncheckedHomework(homeworkId: string): Promise<Homework> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Yetkisiz.");

  const { data: hw } = await supabase
    .from("homework")
    .select("*")
    .eq("id", homeworkId)
    .single();
  if (!hw || (hw as Homework).student_id !== userData.user.id) {
    throw new Error("Ödev bulunamadı.");
  }
  if ((hw as Homework).checked_at) {
    throw new Error("Bu ödev kontrol edildi; işaretler artık değiştirilemez.");
  }
  return hw as Homework;
}

function revalidateStudentHomeworkPaths(studentId: string) {
  revalidatePath("/student/homework");
  revalidatePath("/student");
  revalidatePath(`/teacher/homework/${studentId}`);
}

/** Öğrencinin "bu testi yaptım" beyanını açar/kapatır. */
export async function setStudentTestMark(formData: FormData) {
  const homeworkId = String(formData.get("homework_id"));
  const sectionId = String(formData.get("section_id"));
  const testNumber = Number(formData.get("test_number"));
  const marked = String(formData.get("marked")) === "true";

  const hw = await requireOwnUncheckedHomework(homeworkId);

  const admin = createAdminClient();
  const { error } = await admin
    .from("homework_tests")
    .update({ student_marked: marked })
    .eq("homework_id", homeworkId)
    .eq("section_id", sectionId)
    .eq("test_number", testNumber);
  if (error) throw new Error(error.message);

  revalidateStudentHomeworkPaths(hw.student_id);
}

/** Testsiz ödevde öğrencinin "tamamladım" beyanını açar/kapatır. */
export async function setStudentHomeworkDone(formData: FormData) {
  const homeworkId = String(formData.get("homework_id"));
  const done = String(formData.get("done")) === "true";

  const hw = await requireOwnUncheckedHomework(homeworkId);

  const admin = createAdminClient();
  const { error } = await admin
    .from("homework")
    .update({ student_marked_done_at: done ? new Date().toISOString() : null })
    .eq("id", homeworkId);
  if (error) throw new Error(error.message);

  revalidateStudentHomeworkPaths(hw.student_id);
}
