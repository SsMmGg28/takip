import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { ExamImportPanel } from "@/components/exams/exam-import-panel";
import { getStudentGrade } from "@/lib/students";
import { examsEnabledForGrade } from "@/lib/kazanim";
import { isGeminiConfigured } from "@/lib/ai/gemini";

export const metadata = { title: "Yeni Deneme" };

export default async function ParentNewExamPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  await requireRole(["parent"]);
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
        backHref={`/parent/exams/${studentId}`}
        aiEnabled={isGeminiConfigured()}
      />
    </>
  );
}
