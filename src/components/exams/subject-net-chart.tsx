"use client";

import { useTheme } from "next-themes";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LGS_SUBJECTS } from "@/lib/kazanim";
import type { ExamChartRow, KazanimTrendRow } from "@/lib/exam-shared";

// Doğrulanmış kategorik palet (dataviz kontrolünden geçti); renk derse
// sabittir, seri sayısı değişse de ders rengi değişmez.
const SERIES_COLORS: Record<"light" | "dark", string[]> = {
  light: ["#2a78d6", "#1baf7a", "#eda100", "#008300", "#4a3aa7", "#e34948"],
  dark: ["#3987e5", "#199e70", "#c98500", "#008300", "#9085e9", "#e66767"],
};

const SUBJECT_ORDER = LGS_SUBJECTS.map((s) => s.name as string);

function subjectColor(subject: string, mode: "light" | "dark") {
  const index = SUBJECT_ORDER.indexOf(subject);
  return SERIES_COLORS[mode][index >= 0 ? index : 0];
}

function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const mode: "light" | "dark" = resolvedTheme === "dark" ? "dark" : "light";
  return {
    mode,
    grid: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)",
    tick: mode === "dark" ? "#94a3c7" : "#64748b",
    tooltip: {
      backgroundColor: mode === "dark" ? "#1b2135" : "#ffffff",
      border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.12)"}`,
      borderRadius: 12,
      fontSize: 12,
    },
  };
}

/** Ders bazlı net gelişimi: her ders sabit renkli bir çizgi. */
export function SubjectNetChart({
  rows,
  subjects,
}: {
  rows: ExamChartRow[];
  subjects: string[];
}) {
  const theme = useChartTheme();

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Henüz deneme sonucu girilmedi.
      </p>
    );
  }

  const ordered = SUBJECT_ORDER.filter((s) => subjects.includes(s)).concat(
    subjects.filter((s) => !SUBJECT_ORDER.includes(s)),
  );

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke={theme.grid} vertical={false} />
          <XAxis
            dataKey="examLabel"
            tick={{ fontSize: 11, fill: theme.tick }}
            tickLine={false}
            axisLine={{ stroke: theme.grid }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: theme.tick }}
            tickLine={false}
            axisLine={false}
            width={34}
          />
          <Tooltip contentStyle={theme.tooltip} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          {ordered.map((subject) => (
            <Line
              key={subject}
              type="monotone"
              dataKey={subject}
              name={subject}
              stroke={subjectColor(subject, theme.mode)}
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 0, fill: subjectColor(subject, theme.mode) }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Deneme puanı gelişimi: tek seri alan grafiği; hedef puan varsa kesikli çizgi. */
export function ScoreChart({
  rows,
  targetScore,
}: {
  rows: ExamChartRow[];
  targetScore?: number | null;
}) {
  const theme = useChartTheme();
  const data = rows.filter((r) => r.score != null);

  if (data.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Puan bilgisi girilmiş deneme yok.
      </p>
    );
  }

  const color = SERIES_COLORS[theme.mode][0];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <defs>
            <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={theme.grid} vertical={false} />
          <XAxis
            dataKey="examLabel"
            tick={{ fontSize: 11, fill: theme.tick }}
            tickLine={false}
            axisLine={{ stroke: theme.grid }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 500]}
            tick={{ fontSize: 11, fill: theme.tick }}
            tickLine={false}
            axisLine={false}
            width={38}
          />
          <Tooltip contentStyle={theme.tooltip} />
          {targetScore != null && (
            <ReferenceLine
              y={targetScore}
              stroke={SERIES_COLORS[theme.mode][2]}
              strokeDasharray="6 4"
              strokeWidth={1.5}
              label={{
                value: `Hedef: ${targetScore}`,
                position: "insideTopRight",
                fontSize: 11,
                fill: theme.tick,
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey="score"
            name="Puan"
            stroke={color}
            strokeWidth={2}
            fill="url(#scoreFill)"
            dot={{ r: 3, strokeWidth: 0, fill: color }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Kazanım doğruluk gelişimi: deneme sırasına göre ders bazında kazanım
 * sorularındaki doğruluk yüzdesi. Ders renkleri net grafiğiyle aynıdır.
 */
export function KazanimTrendChart({
  rows,
  subjects,
}: {
  rows: KazanimTrendRow[];
  subjects: string[];
}) {
  const theme = useChartTheme();

  if (rows.length < 2) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Gelişim grafiği için kazanım verili en az iki deneme gerekli.
      </p>
    );
  }

  const ordered = SUBJECT_ORDER.filter((s) => subjects.includes(s)).concat(
    subjects.filter((s) => !SUBJECT_ORDER.includes(s)),
  );

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke={theme.grid} vertical={false} />
          <XAxis
            dataKey="examLabel"
            tick={{ fontSize: 11, fill: theme.tick }}
            tickLine={false}
            axisLine={{ stroke: theme.grid }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: theme.tick }}
            tickLine={false}
            axisLine={false}
            width={34}
            tickFormatter={(v) => `%${v}`}
          />
          <Tooltip contentStyle={theme.tooltip} formatter={(v) => [`%${v}`, undefined]} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          {ordered.map((subject) => (
            <Line
              key={subject}
              type="monotone"
              dataKey={subject}
              name={subject}
              stroke={subjectColor(subject, theme.mode)}
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 0, fill: subjectColor(subject, theme.mode) }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
