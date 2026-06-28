import { createClient } from "@/lib/supabase/server";

export interface ExamChartRow {
  examLabel: string;
  examDate: string;
  [subject: string]: string | number;
}

export interface WeakTopic {
  subject: string;
  topic: string;
  correct: number;
  incorrect: number;
  blank: number;
  accuracy: number;
}

export interface ExamAnalysis {
  chartRows: ExamChartRow[];
  subjects: string[];
  weakTopics: WeakTopic[];
}

/** "Net" hesaplama: doğru - yanlış/4 (Türkiye'deki standart çoktan seçmeli sınav netleştirme yöntemi). */
function calculateNet(correct: number, incorrect: number) {
  return Math.round((correct - incorrect / 4) * 100) / 100;
}

export async function getExamAnalysis(studentId: string): Promise<ExamAnalysis> {
  const supabase = await createClient();

  const { data: exams } = await supabase
    .from("exams")
    .select("*")
    .eq("student_id", studentId)
    .order("exam_date", { ascending: true });

  const examIds = (exams ?? []).map((e) => e.id);

  const { data: examSubjects } = examIds.length
    ? await supabase.from("exam_subjects").select("*").in("exam_id", examIds)
    : { data: [] };

  const subjectIds = (examSubjects ?? []).map((s) => s.id);

  const { data: examTopics } = subjectIds.length
    ? await supabase.from("exam_topics").select("*").in("exam_subject_id", subjectIds)
    : { data: [] };

  const subjectsSet = new Set<string>();
  const chartRows: ExamChartRow[] = (exams ?? []).map((exam) => {
    const row: ExamChartRow = {
      examLabel: `${exam.exam_name} (${exam.exam_date})`,
      examDate: exam.exam_date,
    };
    const subjectsForExam = (examSubjects ?? []).filter((s) => s.exam_id === exam.id);
    for (const s of subjectsForExam) {
      subjectsSet.add(s.subject_name);
      row[s.subject_name] = calculateNet(s.correct_count, s.incorrect_count);
    }
    return row;
  });

  const topicTotals = new Map<
    string,
    { subject: string; topic: string; correct: number; incorrect: number; blank: number }
  >();

  for (const topic of examTopics ?? []) {
    const subject = (examSubjects ?? []).find((s) => s.id === topic.exam_subject_id);
    if (!subject) continue;
    const key = `${subject.subject_name}::${topic.topic_name}`;
    const existing = topicTotals.get(key) ?? {
      subject: subject.subject_name,
      topic: topic.topic_name,
      correct: 0,
      incorrect: 0,
      blank: 0,
    };
    existing.correct += topic.correct_count;
    existing.incorrect += topic.incorrect_count;
    existing.blank += topic.blank_count;
    topicTotals.set(key, existing);
  }

  const weakTopics: WeakTopic[] = Array.from(topicTotals.values())
    .map((t) => ({
      ...t,
      accuracy:
        t.correct + t.incorrect === 0 ? 0 : Math.round((t.correct / (t.correct + t.incorrect)) * 100),
    }))
    .sort((a, b) => a.accuracy - b.accuracy);

  return {
    chartRows,
    subjects: Array.from(subjectsSet),
    weakTopics,
  };
}
