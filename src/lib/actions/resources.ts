"use server";

import { revalidatePath, updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { BOOK_CATALOG_TAG } from "@/lib/books";
import { getTeacherIds, notifyUsers } from "@/lib/notifications";
import {
  parseDifficulty,
  parseGrade,
  parseSections,
  planSectionSync,
  type ExistingSection,
  type SectionInput,
} from "@/lib/resources-parse";

type DbClient = Awaited<ReturnType<typeof createClient>>;

function revalidateResourcePaths() {
  // Onaylı katalog cache'i ("use cache" + BOOK_CATALOG_TAG) anında tazelensin.
  updateTag(BOOK_CATALOG_TAG);
  revalidatePath("/teacher/resources");
  revalidatePath("/parent/resources");
  revalidatePath("/student/resources");
}

/**
 * Bir kitabın bölümlerini istenen listeye senkronlar. Eşleştirme/plan mantığı
 * saf `planSectionSync`'te (test edilebilir); burada yalnız plan uygulanır:
 * eşleşen bölüm GÜNCELLENİR (test ilerlemesi korunur), yeni EKLENİR, düşen SİLİNİR.
 */
async function syncSections(
  supabase: DbClient,
  bookId: string,
  desired: SectionInput[],
) {
  const { data: existing } = await supabase
    .from("resource_book_sections")
    .select("id, name, kazanim_code")
    .eq("book_id", bookId);

  const plan = planSectionSync((existing as ExistingSection[]) ?? [], desired);

  for (const u of plan.toUpdate) {
    await supabase
      .from("resource_book_sections")
      .update({
        name: u.name,
        test_count: u.testCount,
        kazanim_code: u.kazanimCode,
        order_index: u.orderIndex,
      })
      .eq("id", u.id);
  }

  if (plan.toInsert.length) {
    await supabase.from("resource_book_sections").insert(
      plan.toInsert.map((s) => ({
        book_id: bookId,
        name: s.name,
        order_index: s.orderIndex,
        test_count: s.testCount,
        kazanim_code: s.kazanimCode,
      })),
    );
  }

  for (const id of plan.toDeleteIds) {
    await supabase.from("resource_book_sections").delete().eq("id", id);
  }
}

/**
 * Kütüphaneye kitap ekler. Sınıf + ders seçilir; bölümler (o dersin kazanımları)
 * ekleme anında girilir. Öğretmen eklerse anında onaylı; veli eklerse onay bekler
 * ve öğretmene bildirim düşer.
 */
export async function createBook(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Yetkisiz.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, is_demo")
    .eq("id", userData.user.id)
    .single();
  if (!profile || (profile.role !== "teacher" && profile.role !== "parent")) {
    throw new Error("Kitap eklemeyi yalnızca öğretmen veya veli yapabilir.");
  }

  const name = String(formData.get("name") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim() || null;
  const grade = parseGrade(formData);
  const sections = parseSections(formData);
  if (!name) throw new Error("Kitap adı gerekli.");
  if (!grade) throw new Error("Sınıf seçilmeli.");
  if (!subject) throw new Error("Ders seçilmeli.");

  const isTeacher = profile.role === "teacher";

  const { data: book, error } = await supabase
    .from("resource_books")
    .insert({
      name,
      subject,
      grade_level: grade,
      // Zorluk yalnızca öğretmen atar; veli eklerse null kalır (öğretmen sonra verir).
      difficulty: isTeacher ? parseDifficulty(formData) : null,
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
        kazanim_code: s.kazanimCode,
      })),
    );
    if (sectionError) throw new Error(sectionError.message);
  }

  if (!isTeacher) {
    await notifyUsers(await getTeacherIds({ demo: profile.is_demo }), {
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

/**
 * Öğretmen: kitabın adını/sınıfını/dersini günceller ve bölümlerini (o sınıf+dersin
 * kazanımlarından girilen test sayıları) senkronlar. Bölüm test ilerlemesi, kazanım
 * kodu/ad eşleşmesi korunarak update ile saklanır.
 */
export async function updateBookWithSections(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim() || null;
  const grade = parseGrade(formData);
  if (!name) throw new Error("Kitap adı gerekli.");

  const { error } = await supabase
    .from("resource_books")
    .update({ name, subject, grade_level: grade, difficulty: parseDifficulty(formData) })
    .eq("id", id);
  if (error) throw new Error(error.message);

  await syncSections(supabase, id, parseSections(formData));

  revalidateResourcePaths();
  revalidatePath(`/teacher/resources/${id}`);
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
