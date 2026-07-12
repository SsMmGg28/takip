"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getTeacherIds, notifyUsers } from "@/lib/notifications";

type DbClient = Awaited<ReturnType<typeof createClient>>;

function revalidateResourcePaths() {
  revalidatePath("/teacher/resources");
  revalidatePath("/parent/resources");
  revalidatePath("/student/resources");
}

interface SectionInput {
  name: string;
  testCount: number;
  kazanimCode: string | null;
}

/**
 * Bölüm satırlarını formdan okur. `section_name`, `section_test_count` ve
 * `section_kazanim_code` alanları aynı sırada gönderilir (KazanimTestGrid). Test
 * sayısı 0/boş olan satırlar (kazanım modunda "bu üniteden test yok") atlanır.
 */
function parseSections(formData: FormData): SectionInput[] {
  const names = formData.getAll("section_name").map((v) => String(v).trim());
  const counts = formData.getAll("section_test_count").map((v) => Number(v));
  const codes = formData.getAll("section_kazanim_code").map((v) => {
    const s = String(v).trim();
    return s ? s : null;
  });
  const sections: SectionInput[] = [];
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const testCount = counts[i];
    if (name && Number.isFinite(testCount) && testCount > 0 && testCount <= 200) {
      sections.push({ name, testCount, kazanimCode: codes[i] ?? null });
    }
  }
  return sections;
}

function parseGrade(formData: FormData): number | null {
  const g = Number(formData.get("grade_level"));
  return g === 5 || g === 6 || g === 7 || g === 8 ? g : null;
}

/** Zorluk derecesi (1-5). Boş/geçersizse null. Yalnızca öğretmen atar. */
function parseDifficulty(formData: FormData): number | null {
  const d = Number(formData.get("difficulty"));
  return Number.isFinite(d) && d >= 1 && d <= 5 ? Math.round(d) : null;
}

/**
 * Bir kitabın bölümlerini istenen listeye senkronlar. Kazanım kodu (yoksa ad)
 * üzerinden eşleştirir: var olanı GÜNCELLER (test ilerlemesi korunur), yeniyi
 * ekler, listeden düşeni siler.
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

  const keyOf = (name: string, code: string | null) =>
    code ? `c:${code}` : `n:${name.trim().toLocaleLowerCase("tr")}`;
  const existingByKey = new Map(
    ((existing as { id: string; name: string; kazanim_code: string | null }[]) ?? []).map((s) => [
      keyOf(s.name, s.kazanim_code),
      s,
    ]),
  );
  const seen = new Set<string>();

  for (let i = 0; i < desired.length; i++) {
    const d = desired[i];
    const key = keyOf(d.name, d.kazanimCode);
    if (seen.has(key)) continue;
    seen.add(key);
    const ex = existingByKey.get(key);
    if (ex) {
      await supabase
        .from("resource_book_sections")
        .update({
          name: d.name,
          test_count: d.testCount,
          kazanim_code: d.kazanimCode,
          order_index: i,
        })
        .eq("id", ex.id);
    } else {
      await supabase.from("resource_book_sections").insert({
        book_id: bookId,
        name: d.name,
        order_index: i,
        test_count: d.testCount,
        kazanim_code: d.kazanimCode,
      });
    }
  }

  for (const [key, ex] of existingByKey) {
    if (!seen.has(key)) {
      await supabase.from("resource_book_sections").delete().eq("id", ex.id);
    }
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
