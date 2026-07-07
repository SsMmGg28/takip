import { SubjectFilterCharts } from "@/components/exams/subject-filter-charts";
import { KazanimAnalysisPanel } from "@/components/exams/kazanim-analysis";
import type { ExamOverview } from "@/lib/exam-analysis";

/**
 * Grafikler + istek üzerine kazanım analizi: üç rolün ortak analiz bölümü.
 * Net grafiği ders filtresiyle tek derse daraltılabilir.
 */
export function ExamAnalysisSection({
  overview,
  studentId,
  targetScore,
}: {
  overview: ExamOverview;
  studentId: string;
  targetScore?: number | null;
}) {
  return (
    <div className="flex flex-col gap-5">
      <SubjectFilterCharts
        rows={overview.chartRows}
        subjects={overview.subjects}
        targetScore={targetScore}
      />
      <KazanimAnalysisPanel studentId={studentId} />
    </div>
  );
}
