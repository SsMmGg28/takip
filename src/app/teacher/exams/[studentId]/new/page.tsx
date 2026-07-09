import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { ExamImportPanel } from "@/components/exams/exam-import-panel";
import { getStudentGrade } from "@/lib/students";
import { examsEnabledForGrade } from "@/lib/kazanim";
import { isGeminiConfigured } from "@/lib/ai/gemini";

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
      <ExamImportPanel
        studentId={studentId}
        grade={grade}
        backHref={`/teacher/exams/${studentId}`}
        aiEnabled={isGeminiConfigured()}
      />
    </>
  );
}
