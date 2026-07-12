import Link from "next/link";
import { notFound } from "next/navigation";
import { GraduationCap, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { ExamAnalysisSection } from "@/components/exams/exam-analysis-section";
import { ExamList } from "@/components/exams/exam-list";
import { TargetScoreDialog } from "@/components/exams/target-score-dialog";
import { KazanimRecommendations } from "@/components/exams/kazanim-recommendations";
import { getExamOverview } from "@/lib/exam-analysis";
import { getKazanimRecommendations } from "@/lib/recommendations";
import { getApprovedBooks } from "@/lib/books";
import { getStudentExamInfo } from "@/lib/students";
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

  const { grade, targetScore } = await getStudentExamInfo(studentId);
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

  const [overview, recommendations, books] = await Promise.all([
    getExamOverview(studentId),
    getKazanimRecommendations(studentId),
    getApprovedBooks({ grade }),
  ]);

  const studentOptions = [
    { id: studentId, fullName: student.full_name, grade },
  ];
  const bookOptions = books.map((b) => ({
    id: b.id,
    name: b.name,
    subject: b.subject,
    grade: b.grade_level,
    sections: b.sections.map((s) => ({
      id: s.id,
      name: s.name,
      testCount: s.test_count,
    })),
  }));

  return (
    <>
      <PageHeader
        title={student.full_name}
        description={`${grade}. sınıf — deneme analizi ve geçmiş denemeler`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <TargetScoreDialog studentId={studentId} currentTarget={targetScore} />
            <Button asChild>
              <Link href={`/teacher/exams/${studentId}/new`}>
                <Plus className="h-4 w-4" />
                Yeni Deneme
              </Link>
            </Button>
          </div>
        }
      />

      <ExamAnalysisSection
        overview={overview}
        studentId={studentId}
        targetScore={targetScore}
      />

      <KazanimRecommendations
        recommendations={recommendations}
        studentId={studentId}
        books={bookOptions}
        students={studentOptions}
      />

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
