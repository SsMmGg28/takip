"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getParentIdsByStudent, notifyUsers } from "@/lib/notifications";
import { parseTestEntries } from "@/lib/homework-parse";
import type { Homework, HomeworkTest } from "@/lib/types";

function revalidateHomeworkPaths(studentIds: string[]) {
  revalidatePath("/teacher/homework");
  for (const id of studentIds) revalidatePath(`/teacher/homework/${id}`);
  revalidatePath("/student/homework");
  revalidatePath("/parent/homework");
}

async function notifyHomeworkAudience(
  studentIds: string[],
  payload: { type: "homework_assigned" | "homework_updated"; title: string; body?: string },
) {
  const parentsByStudent = await getParentIdsByStudent(studentIds);
  const parentIds = studentIds.flatMap((id) => parentsByStudent.get(id) ?? []);

  await Promise.all([
    notifyUsers(studentIds, { ...payload, link: "/student/homework" }),
    notifyUsers(parentIds, { ...payload, link: "/parent/homework" }),
  ]);
}

/**
 * Toplu ödev gönderimi: seçilen tüm öğrencilere aynı ödev, ortak grup
 * kimliğiyle ayrı satırlar olarak açılır; kontrol öğrenci bazında yapılır.
 * Dosya eki grup başına tek kopya yüklenir.
 */
export async function createHomework(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Yetkisiz.");

  const studentIds = formData
    .getAll("student_ids")
    .map((v) => String(v))
    .filter(Boolean);
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const dueDate = String(formData.get("due_date") ?? "") || null;
  const bookId = String(formData.get("book_id") ?? "") || null;
  const testEntries = parseTestEntries(formData);

  const file = formData.get("attachment") as File | null;
  const hasFile = file && file.size > 0;

  if (!title) throw new Error("Başlık gerekli.");
  if (!studentIds.length) throw new Error("En az bir öğrenci seç.");

  const groupId = randomUUID();

  const { data: rows, error } = await supabase
    .from("homework")
    .insert(
      studentIds.map((studentId) => ({
        student_id: studentId,
        title,
        description,
        due_date: dueDate,
        book_id: bookId,
        assignment_group_id: groupId,
        created_by: userData.user.id,
      })),
    )
    .select();
  if (error || !rows?.length) throw new Error(error?.message ?? "Ödev oluşturulamadı.");

  if (testEntries.length) {
    const { error: testError } = await supabase.from("homework_tests").insert(
      rows.flatMap((hw) =>
        testEntries.map((t) => ({ homework_id: hw.id, ...t })),
      ),
    );
    if (testError) throw new Error(testError.message);
  }

  if (hasFile) {
    const path = `${groupId}/${file.name}`;
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
        .eq("assignment_group_id", groupId);
    }
  }

  await notifyHomeworkAudience(studentIds, {
    type: "homework_assigned",
    title: "Yeni ödev",
    body: dueDate
      ? `"${title}" — teslim: ${new Date(dueDate).toLocaleDateString("tr-TR")}`
      : `"${title}"`,
  });

  revalidateHomeworkPaths(studentIds);
}

/**
 * Ödev düzenleme. scope=group ise toplu gönderimdeki tüm öğrencilerin ödevi
 * birlikte güncellenir. Her düzenleme sonrası öğrenci + veliye bildirim gider.
 * Test listesi değişirse mevcut kontrol işaretleri (tamamlandı) korunur.
 */
export async function updateHomework(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const scope = String(formData.get("scope") ?? "one");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const dueDate = String(formData.get("due_date") ?? "") || null;
  const testEntries = parseTestEntries(formData);
  if (!title) throw new Error("Başlık gerekli.");

  const { data: current } = await supabase
    .from("homework")
    .select("*")
    .eq("id", id)
    .single();
  if (!current) throw new Error("Ödev bulunamadı.");
  const hw = current as Homework;

  const { data: targetRows, error } = await supabase
    .from("homework")
    .update({ title, description, due_date: dueDate })
    .eq(
      scope === "group" ? "assignment_group_id" : "id",
      scope === "group" ? hw.assignment_group_id : id,
    )
    .select();
  if (error || !targetRows?.length) {
    throw new Error(error?.message ?? "Ödev güncellenemedi.");
  }

  const targets = targetRows as Homework[];
  const targetIds = targets.map((t) => t.id);

  // Testleri yeniden kur: aynı (bölüm, test) çiftinin kontrol işareti korunur.
  const { data: oldTests } = await supabase
    .from("homework_tests")
    .select("*")
    .in("homework_id", targetIds);

  const oldByKey = new Map(
    ((oldTests as HomeworkTest[] | null) ?? []).map((t) => [
      `${t.homework_id}:${t.section_id}:${t.test_number}`,
      t,
    ]),
  );

  await supabase.from("homework_tests").delete().in("homework_id", targetIds);
  if (testEntries.length) {
    const { error: testError } = await supabase.from("homework_tests").insert(
      targetIds.flatMap((homeworkId) =>
        testEntries.map((t) => {
          const old = oldByKey.get(`${homeworkId}:${t.section_id}:${t.test_number}`);
          return {
            homework_id: homeworkId,
            ...t,
            completed: old?.completed ?? false,
            completed_at: old?.completed_at ?? null,
          };
        }),
      ),
    );
    if (testError) throw new Error(testError.message);
  }

  const studentIds = targets.map((t) => t.student_id);
  await notifyHomeworkAudience(studentIds, {
    type: "homework_updated",
    title: "Ödev güncellendi",
    body: `"${title}" ödevinde değişiklik yapıldı, kontrol et.`,
  });

  revalidateHomeworkPaths(studentIds);
}

/**
 * Ödev kontrolü: öğrencinin yaptığı testler işaretlenir, yapılanlar genel
 * ilerlemeye (student_test_progress) de işlenir. Hepsi yapıldıysa ödev
 * "tamamlandı", değilse "eksik" olur ve veliye bildirim gider.
 */
export async function checkHomework(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Yetkisiz.");

  const id = String(formData.get("id"));
  const doneEntries = new Set(formData.getAll("done").map((v) => String(v)));
  // Testsiz (serbest) ödevlerde sonuç doğrudan gelir
  const manualResult = String(formData.get("result") ?? "");
  const feedback = String(formData.get("feedback") ?? "").trim() || null;

  const { data: current } = await supabase
    .from("homework")
    .select("*")
    .eq("id", id)
    .single();
  if (!current) throw new Error("Ödev bulunamadı.");
  const hw = current as Homework;

  const { data: tests } = await supabase
    .from("homework_tests")
    .select("*")
    .eq("homework_id", id);
  const testList = (tests as HomeworkTest[] | null) ?? [];

  let status: "completed" | "incomplete";
  let missingCount = 0;

  if (testList.length) {
    const now = new Date().toISOString();
    const doneIds: string[] = [];
    const undoneIds: string[] = [];
    for (const t of testList) {
      if (doneEntries.has(`${t.section_id}:${t.test_number}`)) doneIds.push(t.id);
      else undoneIds.push(t.id);
    }

    if (doneIds.length) {
      await supabase
        .from("homework_tests")
        .update({ completed: true, completed_at: now })
        .in("id", doneIds);
    }
    if (undoneIds.length) {
      await supabase
        .from("homework_tests")
        .update({ completed: false, completed_at: null })
        .in("id", undoneIds);
    }

    // Yapılan testleri genel kitap ilerlemesine de işle
    const doneTests = testList.filter((t) => doneIds.includes(t.id));
    if (doneTests.length) {
      await supabase.from("student_test_progress").upsert(
        doneTests.map((t) => ({
          student_id: hw.student_id,
          section_id: t.section_id,
          test_number: t.test_number,
          marked_by: userData.user.id,
        })),
        { onConflict: "student_id,section_id,test_number", ignoreDuplicates: true },
      );
    }

    // Kontrolde işareti kaldırılan testleri kitap ilerlemesinden de geri al;
    // yoksa daha önce "yapıldı" sayılan test yüzdeleri şişik bırakır.
    const undoneTests = testList.filter((t) => undoneIds.includes(t.id));
    const undoneBySection = new Map<string, number[]>();
    for (const t of undoneTests) {
      if (!undoneBySection.has(t.section_id)) undoneBySection.set(t.section_id, []);
      undoneBySection.get(t.section_id)!.push(t.test_number);
    }
    for (const [sectionId, testNumbers] of undoneBySection) {
      await supabase
        .from("student_test_progress")
        .delete()
        .eq("student_id", hw.student_id)
        .eq("section_id", sectionId)
        .in("test_number", testNumbers);
    }

    missingCount = undoneIds.length;
    status = missingCount === 0 ? "completed" : "incomplete";
  } else {
    status = manualResult === "completed" ? "completed" : "incomplete";
  }

  const { error } = await supabase
    .from("homework")
    .update({ status, feedback, checked_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);

  if (status === "incomplete") {
    const body = testList.length
      ? `"${hw.title}" ödevinde ${missingCount} test eksik kaldı.`
      : `"${hw.title}" ödevi tamamlanmadı.`;
    const parentsByStudent = await getParentIdsByStudent([hw.student_id]);
    await Promise.all([
      notifyUsers(parentsByStudent.get(hw.student_id) ?? [], {
        type: "homework_incomplete",
        title: "Ödev eksik yapıldı",
        body,
        link: "/parent/homework",
      }),
      notifyUsers([hw.student_id], {
        type: "homework_incomplete",
        title: "Ödevin eksik",
        body: feedback ? `${body} Öğretmen notu: ${feedback}` : body,
        link: "/student/homework",
      }),
    ]);
  }

  revalidateHomeworkPaths([hw.student_id]);
}

/**
 * Kısayol: eksik kalan testleri aynı öğrenciye yeni bir ödev olarak gönderir.
 */
export async function reassignMissingTests(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Yetkisiz.");

  const id = String(formData.get("id"));
  const dueDate = String(formData.get("due_date") ?? "") || null;

  const { data: current } = await supabase
    .from("homework")
    .select("*")
    .eq("id", id)
    .single();
  if (!current) throw new Error("Ödev bulunamadı.");
  const hw = current as Homework;

  const { data: tests } = await supabase
    .from("homework_tests")
    .select("*")
    .eq("homework_id", id)
    .eq("completed", false);
  const missing = (tests as HomeworkTest[] | null) ?? [];
  if (!missing.length) throw new Error("Eksik test kalmamış.");

  const { data: newHw, error } = await supabase
    .from("homework")
    .insert({
      student_id: hw.student_id,
      title: `${hw.title} — Eksikler`,
      description: hw.description,
      due_date: dueDate,
      book_id: hw.book_id,
      assignment_group_id: randomUUID(),
      created_by: userData.user.id,
    })
    .select()
    .single();
  if (error || !newHw) throw new Error(error?.message ?? "Ödev oluşturulamadı.");

  const { error: testError } = await supabase.from("homework_tests").insert(
    missing.map((t) => ({
      homework_id: newHw.id,
      section_id: t.section_id,
      test_number: t.test_number,
    })),
  );
  if (testError) throw new Error(testError.message);

  await notifyHomeworkAudience([hw.student_id], {
    type: "homework_assigned",
    title: "Eksik testler yeniden ödevlendirildi",
    body: `"${hw.title}" ödevinden ${missing.length} test yeniden gönderildi.`,
  });

  revalidateHomeworkPaths([hw.student_id]);
}

async function removeAttachmentIfOrphan(attachmentPath: string | null, excludeIds: string[]) {
  if (!attachmentPath) return;
  const supabase = await createClient();
  const { data: others } = await supabase
    .from("homework")
    .select("id")
    .eq("attachment_path", attachmentPath)
    .not("id", "in", `(${excludeIds.join(",")})`)
    .limit(1);
  if (!others?.length) {
    await supabase.storage.from("homework-attachments").remove([attachmentPath]);
  }
}

export async function deleteHomework(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));

  const { data: hw } = await supabase
    .from("homework")
    .select("id, student_id, attachment_path")
    .eq("id", id)
    .single();
  if (!hw) return;

  // Ek dosyası grup içinde paylaşılıyor olabilir; başka satır kullanmıyorsa sil
  await removeAttachmentIfOrphan(hw.attachment_path, [id]);
  await supabase.from("homework").delete().eq("id", id);

  revalidateHomeworkPaths([hw.student_id]);
}

/** Toplu gönderimin tamamını (tüm öğrencilerdeki kopyalarıyla) siler. */
export async function deleteHomeworkGroup(formData: FormData) {
  const supabase = await createClient();
  const groupId = String(formData.get("group_id"));

  const { data: rows } = await supabase
    .from("homework")
    .select("id, student_id, attachment_path")
    .eq("assignment_group_id", groupId);
  if (!rows?.length) return;

  await removeAttachmentIfOrphan(
    rows[0].attachment_path,
    rows.map((r) => r.id),
  );
  await supabase.from("homework").delete().eq("assignment_group_id", groupId);

  revalidateHomeworkPaths(rows.map((r) => r.student_id));
}
