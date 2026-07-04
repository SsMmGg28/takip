"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getTeacherIds, notifyUsers } from "@/lib/notifications";

function revalidateResourcePaths() {
  revalidatePath("/teacher/resources");
  revalidatePath("/parent/resources");
  revalidatePath("/student/resources");
}

interface SectionInput {
  name: string;
  testCount: number;
}

function parseSections(formData: FormData): SectionInput[] {
  const names = formData.getAll("section_name").map((v) => String(v).trim());
  const counts = formData.getAll("section_test_count").map((v) => Number(v));
  const sections: SectionInput[] = [];
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const testCount = counts[i];
    if (name && Number.isFinite(testCount) && testCount > 0 && testCount <= 200) {
      sections.push({ name, testCount });
    }
  }
  return sections;
}

/**
 * Kütüphaneye kitap ekler. Öğretmen eklerse anında onaylı; veli eklerse
 * onay bekler ve öğretmene bildirim düşer. Bölümler ekleme anında girilir.
 */
export async function createBook(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Yetkisiz.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", userData.user.id)
    .single();
  if (!profile || (profile.role !== "teacher" && profile.role !== "parent")) {
    throw new Error("Kitap eklemeyi yalnızca öğretmen veya veli yapabilir.");
  }

  const name = String(formData.get("name") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim() || null;
  const sections = parseSections(formData);
  if (!name) throw new Error("Kitap adı gerekli.");

  const isTeacher = profile.role === "teacher";

  const { data: book, error } = await supabase
    .from("resource_books")
    .insert({
      name,
      subject,
      created_by: userData.user.id,
      approved: isTeacher,
      approved_by: isTeacher ? userData.user.id : null,
      approved_at: isTeacher ? new Date().toISOString() : null,
    })
    .select()
    .single();
  if (error || !book) throw new Error(error?.message ?? "Kitap eklenemedi.");

  if (sections.length) {
    const { error: sectionError } = await supabase.from("resource_book_sections").insert(
      sections.map((s, i) => ({
        book_id: book.id,
        name: s.name,
        order_index: i,
        test_count: s.testCount,
      })),
    );
    if (sectionError) throw new Error(sectionError.message);
  }

  if (!isTeacher) {
    await notifyUsers(await getTeacherIds(), {
      type: "book_pending",
      title: "Yeni kitap onay bekliyor",
      body: `${profile.full_name}, "${name}" kitabını kütüphaneye eklemek istiyor.`,
      link: "/teacher/resources",
    });
  }

  revalidateResourcePaths();
  return { bookId: book.id as string, pending: !isTeacher };
}

/** Öğretmen: veli tarafından eklenen kitabı onaylar. */
export async function approveBook(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Yetkisiz.");

  const id = String(formData.get("id"));
  const { data: book, error } = await supabase
    .from("resource_books")
    .update({
      approved: true,
      approved_by: userData.user.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error || !book) throw new Error(error?.message ?? "Kitap onaylanamadı.");

  await notifyUsers([book.created_by], {
    type: "book_approved",
    title: "Kitabın onaylandı",
    body: `"${book.name}" kütüphaneye eklendi. Artık çocuğunun kitaplığına ekleyebilirsin.`,
    link: "/parent/resources",
  });

  revalidateResourcePaths();
}

/** Öğretmen: bekleyen kitabı reddeder (kitap silinir). */
export async function rejectBook(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));

  const { data: book } = await supabase
    .from("resource_books")
    .select("id, name, created_by, approved")
    .eq("id", id)
    .single();
  if (!book || book.approved) throw new Error("Bekleyen kitap bulunamadı.");

  const { error } = await supabase.from("resource_books").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await notifyUsers([book.created_by], {
    type: "book_rejected",
    title: "Kitap isteğin reddedildi",
    body: `"${book.name}" kütüphaneye eklenmedi.`,
    link: "/parent/resources",
  });

  revalidateResourcePaths();
}

/** Veli: kendi bekleyen kitabını geri çeker. */
export async function withdrawPendingBook(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("resource_books").delete().eq("id", id).eq("approved", false);
  revalidateResourcePaths();
}

/** Öğretmen: kitap adını/dersini günceller. */
export async function updateBook(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim() || null;
  if (!name) throw new Error("Kitap adı gerekli.");

  const { error } = await supabase
    .from("resource_books")
    .update({ name, subject })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidateResourcePaths();
  revalidatePath(`/teacher/resources/${id}`);
}

export async function addBookSection(formData: FormData) {
  const supabase = await createClient();
  const bookId = String(formData.get("book_id"));
  const name = String(formData.get("name") ?? "").trim();
  const orderIndex = Number(formData.get("order_index") ?? 0);
  const testCount = Number(formData.get("test_count") ?? 0);

  if (!name || testCount <= 0) throw new Error("Bölüm adı ve test sayısı gerekli.");

  const { error } = await supabase.from("resource_book_sections").insert({
    book_id: bookId,
    name,
    order_index: orderIndex,
    test_count: testCount,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/teacher/resources/${bookId}`);
  revalidateResourcePaths();
}

export async function updateBookSection(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const bookId = String(formData.get("book_id"));
  const name = String(formData.get("name") ?? "").trim();
  const testCount = Number(formData.get("test_count") ?? 0);
  if (!name || testCount <= 0) throw new Error("Bölüm adı ve test sayısı gerekli.");

  const { error } = await supabase
    .from("resource_book_sections")
    .update({ name, test_count: testCount })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/teacher/resources/${bookId}`);
  revalidateResourcePaths();
}

export async function deleteBookSection(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const bookId = String(formData.get("book_id"));
  await supabase.from("resource_book_sections").delete().eq("id", id);
  revalidatePath(`/teacher/resources/${bookId}`);
  revalidateResourcePaths();
}

export async function deleteBook(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("resource_books").delete().eq("id", id);
  revalidateResourcePaths();
}

// ── Öğrenci kitaplığı ──────────────────────────────────────────────────────

/** Veli: kütüphanedeki onaylı kitabı çocuğunun kitaplığına ekler. */
export async function addBookToShelf(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Yetkisiz.");

  const studentId = String(formData.get("student_id"));
  const bookId = String(formData.get("book_id"));

  const { error } = await supabase.from("student_books").insert({
    student_id: studentId,
    book_id: bookId,
    added_by: userData.user.id,
  });
  // Aynı kitap zaten ekliyse (unique ihlali) sessizce geç
  if (error && !error.message.includes("duplicate")) throw new Error(error.message);

  revalidateResourcePaths();
}

/** Veli: kitabı çocuğunun kitaplığından çıkarır (ilerleme kayıtları silinmez). */
export async function removeBookFromShelf(formData: FormData) {
  const supabase = await createClient();
  const studentId = String(formData.get("student_id"));
  const bookId = String(formData.get("book_id"));

  await supabase
    .from("student_books")
    .delete()
    .eq("student_id", studentId)
    .eq("book_id", bookId);

  revalidateResourcePaths();
}

// ── Test ilerlemesi ────────────────────────────────────────────────────────

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
