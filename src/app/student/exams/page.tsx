import { GraduationCap } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ExamAnalysisSection } from "@/components/exams/exam-analysis-section";
import { ExamList } from "@/components/exams/exam-list";
import { getExamOverview } from "@/lib/exam-analysis";
import { getStudentExamInfo } from "@/lib/students";
import { examsEnabledForGrade } from "@/lib/kazanim";

export const metadata = { title: "Denemeler" };

export default async function StudentExamsPage() {
  const profile = await requireRole(["student"]);

  const { grade, targetScore } = await getStudentExamInfo(profile.id);
  if (!examsEnabledForGrade(grade)) {
    return (
      <>
        <PageHeader title="Deneme Analizim" />
        <EmptyState
          icon={GraduationCap}
          title="Deneme takibi sınıf düzeyinde kapalı"
          description="Deneme takibi yalnızca 7. ve 8. sınıf öğrencileri için aktiftir."
        />
      </>
    );
  }

  const overview = await getExamOverview(profile.id);

  return (
    <>
      <PageHeader
        title="Deneme Analizim"
        description="Net ve puan gelişimin, kazanım analizin ve geçmiş denemelerin."
      />

      <ExamAnalysisSection
        overview={overview}
        studentId={profile.id}
        targetScore={targetScore}
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Geçmiş Denemelerim</h2>
        <ExamList
          exams={overview.exams}
          detailHrefPrefix="/student/exams"
          role="student"
        />
      </section>
    </>
  );
}
