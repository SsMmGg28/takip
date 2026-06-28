import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddSubjectDialog } from "@/components/teacher/add-subject-dialog";
import { ExamSubjectCard } from "@/components/teacher/exam-subject-card";
import type { ExamSubject, ExamTopic } from "@/lib/types";

export default async function TeacherExamDetailPage({
  params,
}: {
  params: Promise<{ studentId: string; examId: string }>;
}) {
  const { studentId, examId } = await params;
  const supabase = await createClient();

  const { data: exam } = await supabase.from("exams").select("*").eq("id", examId).single();
  if (!exam) notFound();

  const { data: subjects } = await supabase
    .from("exam_subjects")
    .select("*")
    .eq("exam_id", examId)
    .order("subject_name");

  const subjectIds = (subjects ?? []).map((s) => s.id);
  const { data: topics } = subjectIds.length
    ? await supabase.from("exam_topics").select("*").in("exam_subject_id", subjectIds)
    : { data: [] };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {exam.exam_name} <span className="text-muted-foreground">({exam.exam_date})</span>
        </h1>
        <AddSubjectDialog examId={examId} studentId={studentId} />
      </div>

      <div className="flex flex-col gap-4">
        {((subjects as ExamSubject[]) ?? []).map((subject) => (
          <ExamSubjectCard
            key={subject.id}
            subject={subject}
            topics={((topics as ExamTopic[]) ?? []).filter(
              (t) => t.exam_subject_id === subject.id,
            )}
            examId={examId}
            studentId={studentId}
          />
        ))}
        {!subjects?.length && (
          <p className="text-muted-foreground">Henüz ders eklenmedi.</p>
        )}
      </div>
    </div>
  );
}
