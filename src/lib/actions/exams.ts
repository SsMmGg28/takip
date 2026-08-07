"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getKazanimAnalysis } from "@/lib/exam-analysis";
import { getTeacherIds, notifyUsers } from "@/lib/notifications";
import type { KazanimAnalysis } from "@/lib/exam-shared";
import { LGS_SUBJECTS, examsEnabledForGrade } from "@/lib/kazanim";

export interface ExamKazanimInput {
  code: string;
  name: string;
  correct: number;
  incorrect: number;
  blank: number;
}

export interface ExamSubjectInput {
  name: string;
  correct: number;
  incorrect: number;
  blank: number;
  kazanimlar: ExamKazanimInput[];
}

export interface ExamPayload {
  studentId: string;
  examName: string;
  examDate: string;
  score: number;
  subjects: ExamSubjectInput[];
}

export interface ActionResult {
  ok: boolean;
  error?: string;
}

function revalidateExamPages() {
  // Yalnız mevcut görünüm tazelenir; layout kapsamlı path revalidation tüm
  // client router cache'ini boşaltıp gezinmeyi yavaşlatıyordu.
  refresh();
}

function isCount(value: unknown): value is number {
  return (
    typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 200
  );
}

function validatePayload(payload: ExamPayload): string | null {
  if (!payload.examName?.trim()) return "Deneme adı gerekli.";
  if (!payload.examDate) return "Deneme tarihi gerekli.";
  if (
    typeof payload.score !== "number" ||
    Number.isNaN(payload.score) ||
    payload.score < 0
  )
    return "Puan gerekli.";
  if (payload.score > 500) return "Puan 500'den büyük olamaz.";

  // Katı giriş: her LGS dersi zorunludur ve doğru+yanlış+boş toplamı dersin
  // soru sayısına TAM eşit olmalıdır (Türkçe/Mat/Fen 20; İnkılap/Din/İng 10).
  for (const def of LGS_SUBJECTS) {
    const subject = payload.subjects.find((s) => s.name === def.name);
    if (!subject) return `${def.name} sonuçları eksik.`;
    if (
      !isCount(subject.correct) ||
      !isCount(subject.incorrect) ||
      !isCount(subject.blank)
    )
      return `${def.name} için doğru/yanlış/boş sayıları eksik veya hatalı.`;
    const total = subject.correct + subject.incorrect + subject.blank;
    if (total !== def.questionCount)
      return `${def.name} için doğru+yanlış+boş toplamı tam ${def.questionCount} olmalı (girilen: ${total}).`;

    for (const k of subject.kazanimlar) {
      if (!isCount(k.correct) || !isCount(k.incorrect) || !isCount(k.blank))
        return `${def.name} kazanım sayıları hatalı.`;
      if (k.correct + k.incorrect + k.blank === 0)
        return `${def.name} dersinde boş kazanım satırı var; sayı girilmeyen kazanımı işaretlemeyin.`;
    }
    const kTotal = subject.kazanimlar.reduce(
      (s, k) => s + k.correct + k.incorrect + k.blank,
      0,
    );
    if (kTotal > total)
      return `${def.name} kazanım toplamı (${kTotal}) ders soru toplamını (${total}) aşamaz.`;
  }
  return null;
}

async function assertExamAccess(studentId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: sp } = await supabase
    .from("student_profiles")
    .select("grade_level")
    .eq("id", studentId)
    .single();
  if (!sp) return "Öğrenci bulunamadı.";
  if (!examsEnabledForGrade(sp.grade_level))
    return "Deneme takibi yalnızca 7. ve 8. sınıf öğrencileri için aktiftir.";
  return null;
}

async function insertSubjects(
  examId: string,
  subjects: ExamSubjectInput[],
): Promise<string | null> {
  const supabase = await createClient();
  // Tüm dersler tek insert'te; dönen id'ler ders adına göre eşlenip kazanım
  // satırları da tek insert'te yazılır (ders başına 2 sorgu yerine toplam 2).
  const { data: subjectRows, error } = await supabase
    .from("exam_subjects")
    .insert(
      subjects.map((subject) => ({
        exam_id: examId,
        subject_name: subject.name,
        correct_count: subject.correct,
        incorrect_count: subject.incorrect,
        blank_count: subject.blank,
      })),
    )
    .select("id, subject_name");
  if (error || subjectRows?.length !== subjects.length) {
    return error?.message ?? "Ders sonucu kaydedilemedi.";
  }

  // Aynı ders adı iki kez geçerse sıra korunarak eşlensin diye id'ler kuyrukta tutulur.
  const idsByName = new Map<string, string[]>();
  for (const row of subjectRows) {
    const list = idsByName.get(row.subject_name) ?? [];
    list.push(row.id);
    idsByName.set(row.subject_name, list);
  }

  const kazanimRows = subjects.flatMap((subject) => {
    const subjectId = idsByName.get(subject.name)?.shift();
    if (!subjectId) return [];
    return subject.kazanimlar.map((k) => ({
      exam_subject_id: subjectId,
      kazanim_code: k.code,
      kazanim_name: k.name,
      correct_count: k.correct,
      incorrect_count: k.incorrect,
      blank_count: k.blank,
    }));
  });

  if (kazanimRows.length > 0) {
    const { error: kError } = await supabase
      .from("exam_kazanim_results")
      .insert(kazanimRows);
    if (kError) return kError.message;
  }
  return null;
}

export async function createFullExam(payload: ExamPayload): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, error: "Yetkisiz." };

  const validationError = validatePayload(payload);
  if (validationError) return { ok: false, error: validationError };

  const accessError = await assertExamAccess(payload.studentId);
  if (accessError) return { ok: false, error: accessError };

  const { data: exam, error } = await supabase
    .from("exams")
    .insert({
      student_id: payload.studentId,
      exam_name: payload.examName.trim(),
      exam_date: payload.examDate,
      score: payload.score,
      created_by: userData.user.id,
    })
    .select("id")
    .single();
  if (error || !exam)
    return { ok: false, error: error?.message ?? "Deneme kaydedilemedi." };

  const insertError = await insertSubjects(exam.id, payload.subjects);
  if (insertError) {
    // Yarım kalan kaydı temizlemeyi dene (cascade ile dersler de silinir).
    await supabase.from("exams").delete().eq("id", exam.id);
    return { ok: false, error: insertError };
  }

  // Veli girdiyse öğretmen haberdar olsun (öğretmen kendi girişinde bildirim almaz).
  const { data: creator } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();
  if (creator?.role !== "teacher") {
    const { data: student } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", payload.studentId)
      .single();
    await notifyUsers(await getTeacherIds(), {
      type: "exam_created",
      title: "Yeni deneme sonucu girildi",
      body: `${student?.full_name ?? "Öğrenci"} — "${payload.examName.trim()}"`,
      link: `/teacher/exams/${payload.studentId}`,
    });
  }

  revalidateExamPages();
  return { ok: true };
}

export async function updateFullExam(
  examId: string,
  payload: ExamPayload,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, error: "Yetkisiz." };

  const validationError = validatePayload(payload);
  if (validationError) return { ok: false, error: validationError };

  const { data: updated, error } = await supabase
    .from("exams")
    .update({
      exam_name: payload.examName.trim(),
      exam_date: payload.examDate,
      score: payload.score,
    })
    .eq("id", examId)
    .select("id");
  if (error) return { ok: false, error: error.message };
  // RLS izin vermediyse (ör. onaysız veli) güncellenen satır dönmez.
  if (!updated?.length)
    return {
      ok: false,
      error: "Bu denemeyi düzenleme yetkin yok. Öğretmen onayı gerekli.",
    };

  // Ders ve kazanım satırlarını baştan yaz (cascade kazanımları da siler).
  const { error: deleteError } = await supabase
    .from("exam_subjects")
    .delete()
    .eq("exam_id", examId);
  if (deleteError) return { ok: false, error: deleteError.message };

  const insertError = await insertSubjects(examId, payload.subjects);
  if (insertError) return { ok: false, error: insertError };

  // Veli onaylı talep üzerinden düzenlediyse talebi kapat.
  await supabase
    .from("exam_edit_requests")
    .update({ status: "used" })
    .eq("exam_id", examId)
    .eq("requested_by", userData.user.id)
    .eq("status", "approved");

  revalidateExamPages();
  return { ok: true };
}

export async function deleteExam(examId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, error: "Yetkisiz." };

  const { data: deleted, error } = await supabase
    .from("exams")
    .delete()
    .eq("id", examId)
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!deleted?.length)
    return { ok: false, error: "Bu denemeyi silme yetkin yok. Öğretmen onayı gerekli." };

  revalidateExamPages();
  return { ok: true };
}

// ─── Düzenleme talepleri ─────────────────────────────────────────────────────

export async function requestExamEdit(
  examId: string,
  reason: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, error: "Yetkisiz." };

  // Aynı deneme için bekleyen/onaylı talep varsa yenisini açma.
  const { data: existing } = await supabase
    .from("exam_edit_requests")
    .select("id, status")
    .eq("exam_id", examId)
    .eq("requested_by", userData.user.id)
    .in("status", ["pending", "approved"]);
  if (existing?.length)
    return {
      ok: false,
      error: "Bu deneme için zaten bekleyen veya onaylı bir talebin var.",
    };

  const { error } = await supabase.from("exam_edit_requests").insert({
    exam_id: examId,
    requested_by: userData.user.id,
    reason: reason.trim() || null,
  });
  if (error) return { ok: false, error: error.message };

  // Öğretmen talebi sayfaya girmeden görsün.
  const { data: exam } = await supabase
    .from("exams")
    .select("exam_name")
    .eq("id", examId)
    .single();
  await notifyUsers(await getTeacherIds(), {
    type: "exam_edit_requested",
    title: "Deneme düzenleme talebi",
    body: exam
      ? `"${exam.exam_name}" denemesi için veli düzenleme talebi gönderdi.`
      : "Bir deneme için veli düzenleme talebi gönderdi.",
    link: "/teacher/exams",
  });

  revalidateExamPages();
  return { ok: true };
}

export async function reviewExamEditRequest(
  requestId: string,
  approve: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, error: "Yetkisiz." };

  const { data: updated, error } = await supabase
    .from("exam_edit_requests")
    .update({
      status: approve ? "approved" : "rejected",
      reviewed_by: userData.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("status", "pending")
    .select("id, exam_id, requested_by");
  if (error) return { ok: false, error: error.message };
  if (!updated?.length)
    return { ok: false, error: "Talep bulunamadı veya zaten incelendi." };

  // Talebi açan veli sonucu bildirimle öğrensin.
  const request = updated[0];
  const { data: exam } = await supabase
    .from("exams")
    .select("exam_name, student_id")
    .eq("id", request.exam_id)
    .single();
  await notifyUsers([request.requested_by], {
    type: "exam_edit_resolved",
    title: approve ? "Düzenleme talebin onaylandı" : "Düzenleme talebin reddedildi",
    body: exam
      ? approve
        ? `"${exam.exam_name}" denemesini artık düzenleyebilirsin.`
        : `"${exam.exam_name}" denemesi için talebin reddedildi.`
      : undefined,
    link: exam ? `/parent/exams/${exam.student_id}` : "/parent/exams",
  });

  revalidateExamPages();
  return { ok: true };
}

// ─── Hedef puan ──────────────────────────────────────────────────────────────

/** Öğrenci için hedef deneme puanı belirler/temizler (yalnızca öğretmen). */
export async function setTargetScore(
  studentId: string,
  targetScore: number | null,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, error: "Yetkisiz." };

  if (
    targetScore !== null &&
    (typeof targetScore !== "number" ||
      Number.isNaN(targetScore) ||
      targetScore < 0 ||
      targetScore > 500)
  ) {
    return { ok: false, error: "Hedef puan 0-500 aralığında olmalı." };
  }

  // RLS (student_profiles_write_teacher) yalnızca öğretmene izin verir;
  // izin yoksa güncellenen satır dönmez.
  const { data: updated, error } = await supabase
    .from("student_profiles")
    .update({ target_score: targetScore })
    .eq("id", studentId)
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!updated?.length)
    return { ok: false, error: "Hedef puanı yalnızca öğretmen belirleyebilir." };

  revalidateExamPages();
  return { ok: true };
}

// ─── İstek üzerine kazanım analizi ───────────────────────────────────────────

/** Kazanım analizi yalnızca talep edildiğinde hesaplanır (RLS erişimi denetler). */
export async function fetchKazanimAnalysis(studentId: string): Promise<KazanimAnalysis> {
  return getKazanimAnalysis(studentId);
}
