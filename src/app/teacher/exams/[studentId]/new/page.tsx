import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { ExamEntryForm } from "@/components/exams/exam-entry-form";
import { getStudentGrade } from "@/lib/students";
import { examsEnabledForGrade } from "@/lib/kazanim";

export default async function TeacherNewExamPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", studentId)
    .single();
  if (!student) notFound();

  const grade = await getStudentGrade(studentId);
  if (!examsEnabledForGrade(grade)) notFound();

  return (
    <>
      <PageHeader
        title="Yeni Deneme"
        description={`${student.full_name} için ders ders sonuçları gir; istersen kazanım işaretle.`}
      />
      <ExamEntryForm
        studentId={studentId}
        grade={grade}
        backHref={`/teacher/exams/${studentId}`}
      />
    </>
  );
}
