import { createClient } from "@/lib/supabase/server";
import { calculateNet, type ExamWithSubjects } from "@/lib/exam-analysis";
import type { Exam, ExamEditRequest, ExamKazanimResult, ExamSubject } from "@/lib/types";
import type { ExamFormInitial } from "@/components/exams/exam-entry-form";

export interface ExamDetails {
  exam: ExamWithSubjects;
  kazanimResults: ExamKazanimResult[];
}

/** Tek denemeyi ders ve kazanım satırlarıyla getirir. */
export async function getExamDetails(examId: string): Promise<ExamDetails | null> {
  const supabase = await createClient();

  const { data: examData } = await supabase
    .from("exams")
    .select("*")
    .eq("id", examId)
    .single();
  if (!examData) return null;
  const exam = examData as Exam;

  const { data: subjectsData } = await supabase
    .from("exam_subjects")
    .select("*")
    .eq("exam_id", examId);
  const subjects = (subjectsData as ExamSubject[]) ?? [];

  const subjectIds = subjects.map((s) => s.id);
  const { data: kazanimData } = subjectIds.length
    ? await supabase
        .from("exam_kazanim_results")
        .select("*")
        .in("exam_subject_id", subjectIds)
    : { data: [] as ExamKazanimResult[] };

  const totalNet = subjects.reduce(
    (sum, s) => sum + calculateNet(s.correct_count, s.incorrect_count),
    0,
  );

  return {
    exam: { ...exam, subjects, totalNet: Math.round(totalNet * 100) / 100 },
    kazanimResults: (kazanimData as ExamKazanimResult[]) ?? [],
  };
}

/** Deneme detayını düzenleme formunun başlangıç verisine çevirir. */
export function toFormInitial(details: ExamDetails): ExamFormInitial {
  return {
    examName: details.exam.exam_name,
    examDate: details.exam.exam_date,
    score: details.exam.score,
    subjects: details.exam.subjects.map((s) => ({
      name: s.subject_name,
      correct: s.correct_count,
      incorrect: s.incorrect_count,
      blank: s.blank_count,
      kazanimlar: details.kazanimResults
        .filter((k) => k.exam_subject_id === s.id)
        .map((k) => ({
          code: k.kazanim_code,
          correct: k.correct_count,
          incorrect: k.incorrect_count,
          blank: k.blank_count,
        })),
    })),
  };
}

/** Bir öğrencinin denemelerine ait düzenleme talepleri (RLS: veli kendininkini görür). */
export async function getEditRequestsForStudent(
  studentId: string,
): Promise<ExamEditRequest[]> {
  const supabase = await createClient();
  const { data: exams } = await supabase
    .from("exams")
    .select("id")
    .eq("student_id", studentId);
  const examIds = (exams ?? []).map((e) => e.id);
  if (!examIds.length) return [];
  const { data } = await supabase
    .from("exam_edit_requests")
    .select("*")
    .in("exam_id", examIds)
    .order("created_at", { ascending: false });
  return (data as ExamEditRequest[]) ?? [];
}

export interface PendingEditRequest extends ExamEditRequest {
  examName: string;
  examDate: string;
  studentName: string;
  parentName: string;
}

/** Öğretmen için bekleyen düzenleme talepleri (deneme + veli bilgisiyle). */
export async function getPendingEditRequests(): Promise<PendingEditRequest[]> {
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("exam_edit_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (!requests?.length) return [];

  const examIds = [...new Set(requests.map((r) => r.exam_id))];
  const { data: exams } = await supabase
    .from("exams")
    .select("id, exam_name, exam_date, student_id")
    .in("id", examIds);

  const profileIds = [
    ...new Set([
      ...requests.map((r) => r.requested_by),
      ...(exams ?? []).map((e) => e.student_id),
    ]),
  ];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", profileIds);

  const examById = new Map((exams ?? []).map((e) => [e.id, e]));
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return (requests as ExamEditRequest[]).map((r) => {
    const exam = examById.get(r.exam_id);
    return {
      ...r,
      examName: exam?.exam_name ?? "Bilinmeyen deneme",
      examDate: exam?.exam_date ?? "",
      studentName: exam ? (nameById.get(exam.student_id) ?? "?") : "?",
      parentName: nameById.get(r.requested_by) ?? "?",
    };
  });
}
