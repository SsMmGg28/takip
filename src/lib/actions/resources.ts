"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Kitap ekle (öğretmen veya veli direkt; öğrenci isteği book_requests'e gider)
export async function createBook(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Yetkisiz.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  const name = String(formData.get("name") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim() || null;
  if (!name) throw new Error("Kitap adı gerekli.");

  // Öğrenci ise istek olarak kaydet
  if (profile?.role === "student") {
    const note = String(formData.get("note") ?? "").trim() || null;
    await supabase.from("book_requests").insert({
      requested_by: userData.user.id,
      name,
      subject,
      note,
    });
    revalidatePath("/student/resources");
    return { kind: "request" as const };
  }

  // Öğretmen/veli direkt katalogda kitap oluşturur
  const { data: book, error } = await supabase
    .from("resource_books")
    .insert({
      name,
      subject,
      created_by: userData.user.id,
      approved: true,
      approved_by: userData.user.id,
      approved_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/teacher/resources");
  revalidatePath("/parent/resources");
  return { kind: "book" as const, bookId: book.id };
}

export async function addBookSection(formData: FormData) {
  const supabase = await createClient();
  const bookId = String(formData.get("book_id"));
  const name = String(formData.get("name") ?? "").trim();
  const orderIndex = Number(formData.get("order_index") ?? 0);
  const testCount = Number(formData.get("test_count") ?? 0);

  if (!name || testCount <= 0) throw new Error("Bölüm adı ve test sayısı gerekli.");

  await supabase.from("resource_book_sections").insert({
    book_id: bookId,
    name,
    order_index: orderIndex,
    test_count: testCount,
  });

  revalidatePath(`/teacher/resources/${bookId}`);
}

export async function deleteBookSection(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const bookId = String(formData.get("book_id"));
  await supabase.from("resource_book_sections").delete().eq("id", id);
  revalidatePath(`/teacher/resources/${bookId}`);
}

export async function deleteBook(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("resource_books").delete().eq("id", id);
  revalidatePath("/teacher/resources");
}

// Test ilerleme: çoklu işaretleme/silme tek seferde
export async function toggleTestProgress(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Yetkisiz.");

  const studentId = String(formData.get("student_id"));
  const sectionId = String(formData.get("section_id"));
  const testNumber = Number(formData.get("test_number"));
  const isDone = formData.get("is_done") === "true";
  const redirectPath = String(formData.get("redirect_path") ?? "");

  if (isDone) {
    await supabase
      .from("student_test_progress")
      .delete()
      .eq("student_id", studentId)
      .eq("section_id", sectionId)
      .eq("test_number", testNumber);
  } else {
    await supabase.from("student_test_progress").insert({
      student_id: studentId,
      section_id: sectionId,
      test_number: testNumber,
      marked_by: userData.user.id,
    });
  }

  if (redirectPath) revalidatePath(redirectPath);
}

// Kitap istekleri (öğretmen onay/red)
export async function approveBookRequest(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Yetkisiz.");

  const id = String(formData.get("id"));
  const { data: req } = await supabase
    .from("book_requests")
    .select("*")
    .eq("id", id)
    .single();
  if (!req) throw new Error("İstek bulunamadı.");

  await supabase.from("resource_books").insert({
    name: req.name,
    subject: req.subject,
    created_by: userData.user.id,
    approved: true,
    approved_by: userData.user.id,
    approved_at: new Date().toISOString(),
  });

  await supabase
    .from("book_requests")
    .update({
      status: "approved",
      reviewed_by: userData.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/teacher/book-requests");
  revalidatePath("/teacher/resources");
}

export async function rejectBookRequest(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const id = String(formData.get("id"));

  await supabase
    .from("book_requests")
    .update({
      status: "rejected",
      reviewed_by: userData.user?.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/teacher/book-requests");
}
