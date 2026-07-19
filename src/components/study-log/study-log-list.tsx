"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteStudyLog } from "@/lib/actions/study-log";
import type { StudyLog } from "@/lib/types";

function dayLabel(ymd: string, today: string, yesterday: string): string {
  if (ymd === today) return "Bugün";
  if (ymd === yesterday) return "Dün";
  return new Date(`${ymd}T00:00:00Z`).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    weekday: "long",
    timeZone: "UTC",
  });
}

function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      aria-label="Kaydı sil"
      disabled={pending}
      onClick={() => {
        const fd = new FormData();
        fd.set("id", id);
        startTransition(async () => {
          try {
            await deleteStudyLog(fd);
            router.refresh();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Silinemedi.");
          }
        });
      }}
      className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

/** Öğrencinin son çalışma kayıtları, güne göre gruplu (silinebilir). */
export function StudyLogList({
  logs,
  today,
  yesterday,
}: {
  logs: StudyLog[];
  today: string;
  yesterday: string;
}) {
  if (logs.length === 0) {
    return (
      <p className="rounded-xl border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
        Henüz kayıt yok. Yukarıdan bugünkü çalışmanı ekle, serini başlat! 🔥
      </p>
    );
  }

  const groups = new Map<string, StudyLog[]>();
  for (const l of logs) {
    if (!groups.has(l.log_date)) groups.set(l.log_date, []);
    groups.get(l.log_date)!.push(l);
  }

  return (
    <div className="flex flex-col gap-4">
      {Array.from(groups, ([date, items]) => {
        const total = items.reduce((s, l) => s + l.minutes, 0);
        return (
          <div key={date} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>{dayLabel(date, today, yesterday)}</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {total} dk
              </span>
            </div>
            <ul className="flex flex-col gap-1.5">
              {items.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center gap-2 rounded-xl border bg-muted/30 px-3 py-2"
                >
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {l.subject}
                  </span>
                  {l.topic && (
                    <span className="shrink-0 truncate text-xs text-muted-foreground">
                      {l.topic}
                    </span>
                  )}
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {l.minutes} dk
                  </span>
                  {typeof l.question_count === "number" && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      · {l.question_count} soru
                    </span>
                  )}
                  {l.note && (
                    <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                      {l.note}
                    </span>
                  )}
                  <span className="ml-auto" />
                  <DeleteButton id={l.id} />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
