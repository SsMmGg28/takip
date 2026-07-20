import { createClient } from "@/lib/supabase/server";
import { getStudentExamInfo } from "@/lib/students";
import { getStudentShelf } from "@/lib/books";
import { effectiveHomeworkStatus } from "@/lib/homework";
import { fitScorePerNet } from "@/lib/exams/projection";
import {
  aggregateKazanim,
  calculateNet,
  type ExamChartRow,
  type KazanimStat,
} from "@/lib/exam-shared";
import type {
  Exam,
  ExamKazanimResult,
  ExamSubject,
  Homework,
  HomeworkStatus,
} from "@/lib/types";

export interface StudentReport {
  student: { id: string; fullName: string; grade: number | null };
  targetScore: number | null;
  range: { from: string; to: string };
  exams: {
    id: string;
    name: string;
    date: string;
    totalNet: number;
    score: number | null;
  }[];
  examCount: number;
  avgScore: number | null;
  avgNet: number | null;
  chartRows: ExamChartRow[];
  weakest: KazanimStat[];
  projection: {
    puanPerNet: number | null;
    gapToTarget: number | null;
    netNeeded: number | null;
  };
  books: { name: string; done: number; total: number }[];
  homework: { total: number; byStatus: Record<HomeworkStatus, number> };
}

/**
 * Bir öğrenci için tarih aralıklı dönem raporu verisini toplar. Denemeler ve
 * kazanımlar `[from, to]` (exam_date) aralığıyla sınırlanır; kitaplık ilerlemesi
 * kümülatif (güncel) snapshot; ödevler due_date aralığına göre sayılır.
 */
export async function getStudentReport(
  studentId: string,
  range: { from: string; to: string },
): Promise<StudentReport | null> {
  const supabase = await createClient();

  // Birbirinden bağımsız beş sorgu tek dalgada; deneme → ders → kazanım
  // zinciri de iç içe embedded select ile aynı sorguda gelir (önceden ~7
  // ardışık gidiş-dönüştü).
  type ExamRow = Exam & {
    exam_subjects: (ExamSubject & { exam_kazanim_results: ExamKazanimResult[] })[];
  };
  const [
    { data: studentRow },
    { grade, targetScore },
    shelf,
    { data: hwData },
    { data: examsData },
  ] = await Promise.all([
    supabase.from("profiles").select("id, full_name").eq("id", studentId).single(),
    getStudentExamInfo(studentId),
    getStudentShelf(studentId),
    supabase
      .from("homework")
      .select("status, due_date")
      .eq("student_id", studentId)
      .gte("due_date", range.from)
      .lte("due_date", range.to),
    supabase
      .from("exams")
      .select("*, exam_subjects(*, exam_kazanim_results(*))")
      .eq("student_id", studentId)
      .gte("exam_date", range.from)
      .lte("exam_date", range.to)
      .order("exam_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);
  if (!studentRow) return null;

  const examsRaw = (examsData as unknown as ExamRow[] | null) ?? [];

  const exams = examsRaw.map((e) => {
    const net = e.exam_subjects.reduce(
      (sum, s) => sum + calculateNet(s.correct_count, s.incorrect_count),
      0,
    );
    return {
      id: e.id,
      name: e.exam_name,
      date: e.exam_date,
      totalNet: Math.round(net * 100) / 100,
      score: e.score,
    };
  });

  const examCount = exams.length;
  const avgScore =
    examCount > 0
      ? Math.round((exams.reduce((s, e) => s + (e.score ?? 0), 0) / examCount) * 10) / 10
      : null;
  const avgNet =
    examCount > 0
      ? Math.round((exams.reduce((s, e) => s + e.totalNet, 0) / examCount) * 10) / 10
      : null;

  // Skor trendi (eski → yeni) — ScoreChart için.
  const chartRows: ExamChartRow[] = [...exams].reverse().map((e) => ({
    examLabel: e.name,
    examDate: e.date,
    score: e.score,
  }));

  // Kazanım toplamları (aralık içi) → en zayıf ilk 8.
  const rows = examsRaw.flatMap((e) =>
    e.exam_subjects.flatMap((sub) =>
      sub.exam_kazanim_results.map((r) => ({
        ...r,
        subjectName: sub.subject_name,
        examId: e.id,
      })),
    ),
  );
  // Yalnızca gerçek zayıflıklar (yanlış veya boş > 0); en yüksek yanlış oranı önce.
  const weakest = aggregateKazanim(rows)
    .filter((k) => k.asked > 0 && (k.incorrect > 0 || k.blank > 0))
    .sort((a, b) => b.wrongRate - a.wrongRate || b.blank - a.blank || b.asked - a.asked)
    .slice(0, 8);

  // Projeksiyon (kişiye özel net→puan).
  const fit = fitScorePerNet(
    exams.map((e) => ({ totalNet: e.totalNet, score: e.score })),
  );
  const puanPerNet = fit?.a ?? null;
  const latestScore = exams[0]?.score ?? null;
  const gapToTarget =
    latestScore != null && targetScore != null
      ? Math.round((targetScore - latestScore) * 10) / 10
      : null;
  const netNeeded =
    gapToTarget != null && gapToTarget > 0 && puanPerNet != null && puanPerNet > 0
      ? Math.ceil(gapToTarget / puanPerNet)
      : null;

  // Kitaplık (güncel snapshot).
  const books = shelf.map((b) => ({
    name: b.name,
    done: b.completedCount,
    total: b.totalTests,
  }));

  // Ödevler (due_date aralığına göre).
  const hw = (hwData as Pick<Homework, "status" | "due_date">[] | null) ?? [];
  const byStatus: Record<HomeworkStatus, number> = {
    assigned: 0,
    completed: 0,
    incomplete: 0,
    overdue: 0,
  };
  for (const h of hw) byStatus[effectiveHomeworkStatus(h)]++;

  return {
    student: { id: studentRow.id, fullName: studentRow.full_name, grade },
    targetScore,
    range,
    exams,
    examCount,
    avgScore,
    avgNet,
    chartRows,
    weakest,
    projection: { puanPerNet, gapToTarget, netNeeded },
    books,
    homework: { total: hw.length, byStatus },
  };
}
