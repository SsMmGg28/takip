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
  const bookId = String(formData.get("book_id") ?? "") || null;

  // Test seçimleri: "section_id:test_number" formatında
  const testEntries = formData.getAll("tests").map((v) => String(v));

  const file = formData.get("attachment") as File | null;
  const hasFile = file && file.size > 0;

  if (!title) throw new Error("Başlık gerekli.");

  const { data: homework, error } = await supabase
    .from("homework")
    .insert({
      student_id: studentId,
      title,
      description,
      due_date: dueDate,
      book_id: bookId,
      created_by: userData.user.id,
    })
    .select()
    .single();
  if (error || !homework) throw new Error(error?.message ?? "Ödev oluşturulamadı.");

  if (testEntries.length > 0) {
    const rows = testEntries
      .map((entry) => {
        const [sectionId, num] = entry.split(":");
        return {
          homework_id: homework.id,
          section_id: sectionId,
          test_number: Number(num),
        };
      })
      .filter((r) => r.section_id && r.test_number > 0);

    if (rows.length > 0) {
      await supabase.from("homework_tests").insert(rows);
    }
  }

  if (hasFile) {
    const path = `${homework.id}/${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("homework-attachments")
      .upload(path, file, { upsert: true });
    if (uploadError) {
      console.error("[homework attachment upload]", uploadError);
    } else {
      await supabase
        .from("homework")
        .update({
          attachment_path: path,
          attachment_name: file.name,
          attachment_uploaded_at: new Date().toISOString(),
        })
        .eq("id", homework.id);
    }
  }

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

  // İlişkili dosyayı da temizle
  const { data: hw } = await supabase
    .from("homework")
    .select("attachment_path")
    .eq("id", id)
    .single();

  if (hw?.attachment_path) {
    await supabase.storage.from("homework-attachments").remove([hw.attachment_path]);
  }

  await supabase.from("homework").delete().eq("id", id);

  revalidatePath(`/teacher/homework/${studentId}`);
}
