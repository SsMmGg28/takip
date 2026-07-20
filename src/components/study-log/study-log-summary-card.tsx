import { Flame, Clock, CalendarCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StudyStreakSummary } from "@/lib/study-log-fetch";

/** Öğretmen/veli için salt-okunur çalışma günlüğü özeti (seri + bu hafta + son kayıtlar). */
export function StudyLogSummaryCard({ summary }: { summary: StudyStreakSummary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="gradient-surface flex h-8 w-8 items-center justify-center rounded-lg text-white">
            <Flame className="h-4 w-4" />
          </span>
          Çalışma Günlüğü
          <span className="text-xs font-normal text-muted-foreground">
            (seri: {summary.current} gün · en iyi: {summary.best})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="inline-flex items-center gap-1.5">
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            Bu hafta <strong className="tabular-nums">{summary.week.days}</strong>/7 gün
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <strong className="tabular-nums">{summary.week.minutes}</strong> dk
          </span>
        </div>

        {summary.recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Öğrenci henüz çalışma kaydı girmedi.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {summary.recent.slice(0, 6).map((l) => (
              <li
                key={l.id}
                className="flex items-center gap-2 rounded-xl border bg-muted/30 px-3 py-1.5 text-sm"
              >
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {new Date(`${l.log_date}T00:00:00Z`).toLocaleDateString("tr-TR", {
                    day: "2-digit",
                    month: "2-digit",
                    timeZone: "UTC",
                  })}
                </span>
                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {l.subject}
                </span>
                {l.topic && (
                  <span className="shrink-0 truncate text-xs text-muted-foreground">
                    {l.topic}
                  </span>
                )}
                <span className="shrink-0 font-semibold tabular-nums">
                  {l.minutes} dk
                </span>
                {typeof l.question_count === "number" && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    · {l.question_count} soru
                  </span>
                )}
                {l.note && (
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">
                    {l.note}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
