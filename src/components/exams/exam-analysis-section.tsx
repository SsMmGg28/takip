import { LineChart, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubjectNetChart, ScoreChart } from "@/components/exams/subject-net-chart";
import { KazanimAnalysisPanel } from "@/components/exams/kazanim-analysis";
import type { ExamOverview } from "@/lib/exam-analysis";

/** Grafikler + istek üzerine kazanım analizi: üç rolün ortak analiz bölümü. */
export function ExamAnalysisSection({
  overview,
  studentId,
}: {
  overview: ExamOverview;
  studentId: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="gradient-surface flex h-8 w-8 items-center justify-center rounded-lg text-white">
                <LineChart className="h-4 w-4" />
              </span>
              Ders Bazlı Net Gelişimi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SubjectNetChart rows={overview.chartRows} subjects={overview.subjects} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="gradient-surface flex h-8 w-8 items-center justify-center rounded-lg text-white">
                <Trophy className="h-4 w-4" />
              </span>
              Puan Gelişimi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreChart rows={overview.chartRows} />
          </CardContent>
        </Card>
      </div>

      <KazanimAnalysisPanel studentId={studentId} />
    </div>
  );
}
