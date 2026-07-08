"use client";

import { useState } from "react";
import { LineChart, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScoreChart, SubjectNetChart } from "@/components/exams/subject-net-chart";
import type { ExamChartRow } from "@/lib/exam-shared";

/**
 * Ders filtresi olan deneme grafikleri: net gelişimi seçilen derse
 * daraltılabilir; puan gelişimi (ders bağımsız) yanında durur.
 */
export function SubjectFilterCharts({
  rows,
  subjects,
  targetScore,
}: {
  rows: ExamChartRow[];
  subjects: string[];
  targetScore?: number | null;
}) {
  const [subject, setSubject] = useState("all");
  const visibleSubjects = subject === "all" ? subjects : [subject];

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
            <span className="flex items-center gap-2">
              <span className="gradient-surface flex h-8 w-8 items-center justify-center rounded-lg text-white">
                <LineChart className="h-4 w-4" />
              </span>
              Ders Bazlı Net Gelişimi
            </span>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm dersler</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SubjectNetChart rows={rows} subjects={visibleSubjects} />
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
          <ScoreChart rows={rows} targetScore={targetScore} />
        </CardContent>
      </Card>
    </div>
  );
}
