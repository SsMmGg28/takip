import { createClient } from "@/lib/supabase/server";
import type { Exam, ExamKazanimResult, ExamSubject } from "@/lib/types";
import {
  aggregateKazanim,
  calculateNet,
  type ExamChartRow,
  type ExamOverview,
  type ExamWithSubjects,
  type KazanimAnalysis,
  type KazanimPriority,
  type KazanimRowWithContext,
  type KazanimTrendRow,
} from "@/lib/exam-shared";

// Saf tipler ve net hesabı client-safe modülde tutulur; server tarafı buradan
// yeniden dışa açar ki mevcut import yolları çalışmaya devam etsin.
export * from "@/lib/exam-shared";

// ─── Deneme genel görünümü (liste + grafikler) ───────────────────────────────

export async function getExamOverview(studentId: string): Promise<ExamOverview> {
  const supabase = await createClient();

  const { data: examsData } = await supabase
    .from("exams")
    .select("*")
    .eq("student_id", studentId)
    .order("exam_date", { ascending: true })
    .order("created_at", { ascending: true });

  const exams = (examsData as Exam[]) ?? [];
  const examIds = exams.map((e) => e.id);

  const { data: subjectsData } = examIds.length
    ? await supabase.from("exam_subjects").select("*").in("exam_id", examIds)
    : { data: [] as ExamSubject[] };
  const allSubjects = (subjectsData as ExamSubject[]) ?? [];

  const subjectsSet = new Set<string>();

  const withSubjects: ExamWithSubjects[] = exams.map((exam) => {
    const subjects = allSubjects.filter((s) => s.exam_id === exam.id);
    const totalNet = subjects.reduce(
      (sum, s) => sum + calculateNet(s.correct_count, s.incorrect_count),
      0,
    );
    for (const s of subjects) subjectsSet.add(s.subject_name);
    return { ...exam, subjects, totalNet: Math.round(totalNet * 100) / 100 };
  });

  const chartRows: ExamChartRow[] = withSubjects.map((exam) => {
    const row: ExamChartRow = {
      examLabel: exam.exam_name,
      examDate: exam.exam_date,
      score: exam.score,
    };
    for (const s of exam.subjects) {
      row[s.subject_name] = calculateNet(s.correct_count, s.incorrect_count);
    }
    return row;
  });

  return {
    // Liste görünümünde en yeni deneme üstte istenir.
    exams: [...withSubjects].reverse(),
    chartRows,
    subjects: Array.from(subjectsSet),
  };
}

// ─── Kazanım analizi ─────────────────────────────────────────────────────────

/**
 * Kazanım analizi: tüm denemelerdeki toplamlar + son 10 denemeden hesaplanan
 * çalışma önceliği listesi.
 *
 * Öncelik algoritması: hata oranı (yanlış + boş/2, soru sayısına bölünür)
 * kazanımın sınavlarda ne sıklıkta sorulduğuyla (log ölçeğinde) çarpılır.
 * Böylece hem çok yanlış yapılan hem de sık sorulan kazanımlar öne çıkar;
 * tek denemede bir kez görülüp yanlış yapılan bir kazanım, 10 denemede 15 kez
 * sorulup sürekli yanlış yapılan bir kazanımın önüne geçemez.
 */
export async function getKazanimAnalysis(studentId: string): Promise<KazanimAnalysis> {
  const supabase = await createClient();

  const { data: examsData } = await supabase
    .from("exams")
    .select("id, exam_name, exam_date, created_at")
    .eq("student_id", studentId)
    .order("exam_date", { ascending: false })
    .order("created_at", { ascending: false });

  const exams = examsData ?? [];
  const examIds = exams.map((e) => e.id);
  if (examIds.length === 0)
    return { stats: [], priorities: [], trend: [], trendSubjects: [], examCount: 0 };

  const { data: subjectsData } = await supabase
    .from("exam_subjects")
    .select("id, exam_id, subject_name")
    .in("exam_id", examIds);
  const subjects = subjectsData ?? [];
  const subjectIds = subjects.map((s) => s.id);

  const { data: kazanimData } = subjectIds.length
    ? await supabase.from("exam_kazanim_results").select("*").in("exam_subject_id", subjectIds)
    : { data: [] as ExamKazanimResult[] };

  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const rows: KazanimRowWithContext[] = ((kazanimData as ExamKazanimResult[]) ?? []).flatMap(
    (row) => {
      const subject = subjectById.get(row.exam_subject_id);
      if (!subject) return [];
      return [{ ...row, subjectName: subject.subject_name, examId: subject.exam_id }];
    },
  );

  // Tüm denemeler üzerinden toplam istatistikler.
  const stats = aggregateKazanim(rows).sort(
    (a, b) => b.wrongRate - a.wrongRate || b.asked - a.asked,
  );

  // Son 10 deneme üzerinden öncelik listesi.
  const lastTenIds = new Set(examIds.slice(0, 10));
  const recentRows = rows.filter((r) => lastTenIds.has(r.examId));
  const priorities: KazanimPriority[] = aggregateKazanim(recentRows)
    .map((stat) => {
      const errorRate = stat.asked === 0 ? 0 : (stat.incorrect + stat.blank * 0.5) / stat.asked;
      const frequencyWeight = Math.log2(1 + stat.asked);
      return {
        ...stat,
        priorityScore: Math.round(errorRate * frequencyWeight * 100) / 100,
      };
    })
    .filter((p) => p.priorityScore > 0)
    .sort((a, b) => b.priorityScore - a.priorityScore);

  // Deneme sırasına göre (eski -> yeni) ders bazında kazanım doğruluk gelişimi.
  const rowsByExam = new Map<string, KazanimRowWithContext[]>();
  for (const r of rows) {
    if (!rowsByExam.has(r.examId)) rowsByExam.set(r.examId, []);
    rowsByExam.get(r.examId)!.push(r);
  }
  const trendSubjectsSet = new Set<string>();
  const trend: KazanimTrendRow[] = [...exams]
    .reverse()
    .flatMap((exam) => {
      const examRows = rowsByExam.get(exam.id) ?? [];
      if (!examRows.length) return [];
      const row: KazanimTrendRow = {
        examLabel: exam.exam_name,
        examDate: exam.exam_date,
      };
      const bySubject = new Map<string, { correct: number; asked: number }>();
      for (const r of examRows) {
        const agg = bySubject.get(r.subjectName) ?? { correct: 0, asked: 0 };
        agg.correct += r.correct_count;
        agg.asked += r.correct_count + r.incorrect_count + r.blank_count;
        bySubject.set(r.subjectName, agg);
      }
      for (const [subject, agg] of bySubject) {
        if (agg.asked === 0) continue;
        row[subject] = Math.round((agg.correct / agg.asked) * 100);
        trendSubjectsSet.add(subject);
      }
      return [row];
    });

  return {
    stats,
    priorities,
    trend,
    trendSubjects: Array.from(trendSubjectsSet),
    examCount: exams.length,
  };
}
