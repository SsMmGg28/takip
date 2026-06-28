"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createExam(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Yetkisiz.");

  const studentId = String(formData.get("student_id"));
  const examName = String(formData.get("exam_name") ?? "").trim();
  const examDate = String(formData.get("exam_date"));

  if (!examName || !examDate) throw new Error("Deneme adı ve tarihi gerekli.");

  await supabase.from("exams").insert({
    student_id: studentId,
    exam_name: examName,
    exam_date: examDate,
    created_by: userData.user.id,
  });

  revalidatePath(`/teacher/exams/${studentId}`);
}

export async function deleteExam(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const studentId = String(formData.get("student_id"));

  await supabase.from("exams").delete().eq("id", id);

  revalidatePath(`/teacher/exams/${studentId}`);
}

export async function createExamSubject(formData: FormData) {
  const supabase = await createClient();
  const examId = String(formData.get("exam_id"));
  const studentId = String(formData.get("student_id"));
  const subjectName = String(formData.get("subject_name") ?? "").trim();
  const correct = Number(formData.get("correct_count") ?? 0);
  const incorrect = Number(formData.get("incorrect_count") ?? 0);
  const blank = Number(formData.get("blank_count") ?? 0);

  if (!subjectName) throw new Error("Ders adı gerekli.");

  await supabase.from("exam_subjects").insert({
    exam_id: examId,
    subject_name: subjectName,
    correct_count: correct,
    incorrect_count: incorrect,
    blank_count: blank,
  });

  revalidatePath(`/teacher/exams/${studentId}/${examId}`);
}

export async function deleteExamSubject(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const examId = String(formData.get("exam_id"));
  const studentId = String(formData.get("student_id"));

  await supabase.from("exam_subjects").delete().eq("id", id);

  revalidatePath(`/teacher/exams/${studentId}/${examId}`);
}

export async function createExamTopic(formData: FormData) {
  const supabase = await createClient();
  const examSubjectId = String(formData.get("exam_subject_id"));
  const examId = String(formData.get("exam_id"));
  const studentId = String(formData.get("student_id"));
  const topicName = String(formData.get("topic_name") ?? "").trim();
  const correct = Number(formData.get("correct_count") ?? 0);
  const incorrect = Number(formData.get("incorrect_count") ?? 0);
  const blank = Number(formData.get("blank_count") ?? 0);

  if (!topicName) throw new Error("Konu adı gerekli.");

  await supabase.from("exam_topics").insert({
    exam_subject_id: examSubjectId,
    topic_name: topicName,
    correct_count: correct,
    incorrect_count: incorrect,
    blank_count: blank,
  });

  revalidatePath(`/teacher/exams/${studentId}/${examId}`);
}

export async function deleteExamTopic(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const examId = String(formData.get("exam_id"));
  const studentId = String(formData.get("student_id"));

  await supabase.from("exam_topics").delete().eq("id", id);

  revalidatePath(`/teacher/exams/${studentId}/${examId}`);
}
