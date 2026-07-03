import { createClient } from "@/lib/supabase/server";
import type { Exam, ExamKazanimResult, ExamSubject } from "@/lib/types";
import {
  calculateNet,
  type ExamChartRow,
  type ExamOverview,
  type ExamWithSubjects,
  type KazanimAnalysis,
  type KazanimPriority,
  type KazanimStat,
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

interface KazanimRowWithContext extends ExamKazanimResult {
  subjectName: string;
  examId: string;
}

function aggregate(rows: KazanimRowWithContext[]): KazanimStat[] {
  const totals = new Map<string, KazanimStat>();
  const examIdsByKey = new Map<string, Set<string>>();
  for (const row of rows) {
    const key = `${row.subjectName}::${row.kazanim_code}`;
    const entry =
      totals.get(key) ??
      ({
        subject: row.subjectName,
        code: row.kazanim_code,
        name: row.kazanim_name,
        correct: 0,
        incorrect: 0,
        blank: 0,
        asked: 0,
        examCount: 0,
        accuracy: 0,
        wrongRate: 0,
      } satisfies KazanimStat);
    entry.correct += row.correct_count;
    entry.incorrect += row.incorrect_count;
    entry.blank += row.blank_count;
    entry.asked += row.correct_count + row.incorrect_count + row.blank_count;
    totals.set(key, entry);

    const examIds = examIdsByKey.get(key) ?? new Set<string>();
    examIds.add(row.examId);
    examIdsByKey.set(key, examIds);
  }
  for (const [key, entry] of totals) {
    entry.examCount = examIdsByKey.get(key)?.size ?? 0;
    entry.accuracy = entry.asked === 0 ? 0 : Math.round((entry.correct / entry.asked) * 100);
    entry.wrongRate = entry.asked === 0 ? 0 : Math.round((entry.incorrect / entry.asked) * 100);
  }
  return Array.from(totals.values());
}

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
    .select("id, exam_date, created_at")
    .eq("student_id", studentId)
    .order("exam_date", { ascending: false })
    .order("created_at", { ascending: false });

  const exams = examsData ?? [];
  const examIds = exams.map((e) => e.id);
  if (examIds.length === 0) return { stats: [], priorities: [], examCount: 0 };

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
  const stats = aggregate(rows).sort(
    (a, b) => b.wrongRate - a.wrongRate || b.asked - a.asked,
  );

  // Son 10 deneme üzerinden öncelik listesi.
  const lastTenIds = new Set(examIds.slice(0, 10));
  const recentRows = rows.filter((r) => lastTenIds.has(r.examId));
  const priorities: KazanimPriority[] = aggregate(recentRows)
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

  return { stats, priorities, examCount: exams.length };
}
