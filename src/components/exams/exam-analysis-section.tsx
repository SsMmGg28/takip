import { SubjectFilterCharts } from "@/components/exams/subject-filter-charts";
import { KazanimAnalysisPanel } from "@/components/exams/kazanim-analysis";
import { ScoreProjection } from "@/components/exams/score-projection";
import { fitScorePerNet } from "@/lib/exams/projection";
import type { ExamOverview } from "@/lib/exam-analysis";

/**
 * Grafikler + puan projeksiyonu + istek üzerine kazanım analizi: üç rolün ortak
 * analiz bölümü. Net grafiği ders filtresiyle tek derse daraltılabilir.
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
  // Öğrencinin kendi (net, puan) geçmişinden net başına puan (tahmini).
  const fit = fitScorePerNet(
    overview.exams.map((e) => ({ totalNet: e.totalNet, score: e.score })),
  );
  const puanPerNet = fit?.a ?? null;
  const latest = overview.exams[0] ?? null; // en yeni deneme üstte

  return (
    <div className="flex flex-col gap-5">
      <SubjectFilterCharts
        rows={overview.chartRows}
        subjects={overview.subjects}
        targetScore={targetScore}
      />
      <ScoreProjection
        latestScore={latest?.score ?? null}
        latestNet={latest?.totalNet ?? null}
        targetScore={targetScore ?? null}
        puanPerNet={puanPerNet}
      />
      <KazanimAnalysisPanel studentId={studentId} puanPerNet={puanPerNet} />
    </div>
  );
}
