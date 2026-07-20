"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DAY_LABELS } from "@/lib/schedule";
import { useNow } from "@/components/dashboard/hooks";
import type { WidgetProps } from "@/components/dashboard/types";

export function TodayScheduleWidget({ data }: WidgetProps) {
  const nowDate = useNow(30_000);
  const now = nowDate ? nowDate.toTimeString().slice(0, 5) : null;
  const todayIdx = ((nowDate ?? new Date()).getDay() + 6) % 7;
  const items = data.schedule.filter((item) => item.day === todayIdx).slice(0, 3);

  if (!items.length) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-center">
        <p className="text-xs text-muted-foreground">
          Bugün ({DAY_LABELS[todayIdx]}) programda etkinlik yok.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ul className="min-h-0 flex-1 space-y-1.5">
        {items.map((item) => {
          const active = now !== null && item.start <= now && now < item.end;
          return (
            <li key={item.id}>
              <Link
                href={`/${data.role}/schedule`}
                className={cn(
                  "flex min-h-11 items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors hover:bg-accent/60",
                  active ? "border-primary/40 bg-primary/8" : "bg-muted/30",
                )}
              >
                <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
                  {item.start}–{item.end}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-medium">
                  {item.label}
                </span>
                {item.studentName && (
                  <span className="shrink-0 rounded-full bg-accent px-1.5 py-0.5 text-xs font-medium text-accent-foreground">
                    {item.studentName}
                  </span>
                )}
                {active && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
              </Link>
            </li>
          );
        })}
      </ul>
      <Link
        href={`/${data.role}/schedule`}
        className="mt-auto flex min-h-11 items-center justify-end gap-1 pt-1.5 text-xs font-medium text-primary hover:underline"
      >
        Tüm program <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
