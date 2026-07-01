"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ExamChartRow } from "@/lib/exam-analysis";

const COLORS = [
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#db2777",
];

export function SubjectNetChart({
  rows,
  subjects,
}: {
  rows: ExamChartRow[];
  subjects: string[];
}) {
  if (rows.length === 0) {
    return <p className="text-muted-foreground">Henüz deneme sonucu girilmedi.</p>;
  }

  return (
    <div className="h-64 w-full sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 8, left: -12 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="examLabel"
            tick={{ fontSize: 10 }}
            interval={0}
            angle={-25}
            dy={12}
            height={60}
          />
          <YAxis tick={{ fontSize: 10 }} width={32} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {subjects.map((subject, i) => (
            <Line
              key={subject}
              type="monotone"
              dataKey={subject}
              name={subject}
              stroke={COLORS[i % COLORS.length]}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
