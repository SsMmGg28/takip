import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { ExamEntryForm } from "@/components/exams/exam-entry-form";
import { getExamDetails, toFormInitial } from "@/lib/exams";
import { getStudentGrade } from "@/lib/students";
import { examsEnabledForGrade } from "@/lib/kazanim";

export const metadata = { title: "Deneme Düzenle" };

export default async function ParentExamEditPage({
  params,
}: {
  params: Promise<{ studentId: string; examId: string }>;
}) {
  const profile = await requireRole(["parent"]);
  const { studentId, examId } = await params;
  const supabase = await createClient();

  const details = await getExamDetails(examId);
  if (!details || details.exam.student_id !== studentId) notFound();

  const grade = await getStudentGrade(studentId);
  if (!examsEnabledForGrade(grade)) notFound();

  // Düzenleme yalnızca öğretmenin onayladığı taleple mümkün.
  const { data: approved } = await supabase
    .from("exam_edit_requests")
    .select("id")
    .eq("exam_id", examId)
    .eq("requested_by", profile.id)
    .eq("status", "approved")
    .maybeSingle();
  if (!approved) notFound();

  return (
    <>
      <PageHeader
        title={`${details.exam.exam_name} — Düzenle`}
        description="Kaydettiğinde onaylı düzenleme talebin kullanılmış sayılır."
      />
      <ExamEntryForm
        studentId={studentId}
        grade={grade}
        backHref={`/parent/exams/${studentId}/${examId}`}
        examId={examId}
        initial={toFormInitial(details)}
      />
    </>
  );
}
