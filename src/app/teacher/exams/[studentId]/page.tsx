import Link from "next/link";
import { notFound } from "next/navigation";
import { GraduationCap, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { ExamAnalysisSection } from "@/components/exams/exam-analysis-section";
import { ExamList } from "@/components/exams/exam-list";
import { getExamOverview } from "@/lib/exam-analysis";
import { getStudentGrade } from "@/lib/students";
import { examsEnabledForGrade } from "@/lib/kazanim";

export default async function TeacherStudentExamsPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", studentId)
    .single();
  if (!student) notFound();

  const grade = await getStudentGrade(studentId);
  if (!examsEnabledForGrade(grade)) {
    return (
      <>
        <PageHeader title={student.full_name} description="Deneme Analizi" />
        <EmptyState
          icon={GraduationCap}
          title="Deneme takibi bu sınıf düzeyinde kapalı"
          description="Deneme takibi yalnızca 7. ve 8. sınıf öğrencileri için aktiftir."
        />
      </>
    );
  }

  const overview = await getExamOverview(studentId);

  return (
    <>
      <PageHeader
        title={student.full_name}
        description={`${grade}. sınıf — deneme analizi ve geçmiş denemeler`}
        action={
          <Button asChild>
            <Link href={`/teacher/exams/${studentId}/new`}>
              <Plus className="h-4 w-4" />
              Yeni Deneme
            </Link>
          </Button>
        }
      />

      <ExamAnalysisSection overview={overview} studentId={studentId} />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Geçmiş Denemeler</h2>
        <ExamList
          exams={overview.exams}
          detailHrefPrefix={`/teacher/exams/${studentId}`}
          role="teacher"
        />
      </section>
    </>
  );
}
