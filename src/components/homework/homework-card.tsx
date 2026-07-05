import { BookOpen, CalendarDays, Check, ClipboardCheck, MessageSquareText } from "lucide-react";
import { AttachmentDownloadLink } from "@/components/homework/attachment-download-link";
import { HomeworkStatusBadge } from "@/components/homework/homework-status-badge";
import { effectiveHomeworkStatus } from "@/lib/homework";
import { cn } from "@/lib/utils";
import type {
  Homework,
  HomeworkTest,
  ResourceBook,
  ResourceBookSection,
} from "@/lib/types";

function dueInfo(homework: Homework): { label: string; urgent: boolean } | null {
  if (!homework.due_date) return null;
  const due = new Date(homework.due_date + "T23:59:59");
  const days = Math.ceil((due.getTime() - Date.now()) / 86_400_000);
  const dateLabel = due.toLocaleDateString("tr-TR");
  if (homework.status !== "assigned") return { label: dateLabel, urgent: false };
  if (days < 0) return { label: `${dateLabel} — süresi geçti`, urgent: true };
  if (days === 0) return { label: `Bugün teslim`, urgent: true };
  if (days <= 2) return { label: `${dateLabel} — ${days} gün kaldı`, urgent: true };
  return { label: `${dateLabel} — ${days} gün kaldı`, urgent: false };
}

/**
 * Öğrenci/veli ödev kartı. Kontrol yapıldıysa test bazında yapıldı/eksik
 * durumunu, yapılmadıysa öğrencinin "yaptım" beyanını gösterir.
 * `testsSlot` verilirse test chip'lerinin yerine o çizilir (öğrencinin
 * etkileşimli işaretleme paneli için).
 */
export function HomeworkCard({
  homework,
  book,
  tests,
  sectionById,
  actions,
  testsSlot,
}: {
  homework: Homework;
  book: ResourceBook | null;
  tests: HomeworkTest[];
  sectionById: Map<string, ResourceBookSection>;
  actions?: React.ReactNode;
  testsSlot?: React.ReactNode;
}) {
  const due = dueInfo(homework);
  const checked = Boolean(homework.checked_at);
  const doneCount = tests.filter((t) => t.completed).length;

  return (
    <div className="hover-lift rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold leading-tight">{homework.title}</p>
            <HomeworkStatusBadge status={effectiveHomeworkStatus(homework)} />
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {due && (
              <span
                className={cn(
                  "inline-flex items-center gap-1",
                  due.urgent && "font-medium text-destructive",
                )}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                {due.label}
              </span>
            )}
            {book && (
              <span className="inline-flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                {book.name}
                {book.subject ? ` — ${book.subject}` : ""}
              </span>
            )}
            {checked && (
              <span className="inline-flex items-center gap-1">
                <ClipboardCheck className="h-3.5 w-3.5" />
                Kontrol edildi
                {tests.length > 0 ? ` · ${doneCount}/${tests.length} test` : ""}
              </span>
            )}
            {!checked && tests.length === 0 && homework.student_marked_done_at && (
              <span className="inline-flex items-center gap-1 text-primary">
                <Check className="h-3.5 w-3.5" />
                Öğrenci tamamladım olarak işaretledi
              </span>
            )}
          </div>
        </div>
        {actions}
      </div>

      {homework.description && (
        <p className="mt-3 text-sm text-muted-foreground">{homework.description}</p>
      )}

      {testsSlot ??
        (tests.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tests.map((t) => {
              const s = sectionById.get(t.section_id);
              const label = s
                ? `${s.name} · Test ${t.test_number}`
                : `Test ${t.test_number}`;
              return (
                <span
                  key={t.id}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                    checked
                      ? t.completed
                        ? "border-success/40 bg-success/10 text-success"
                        : "border-warning/40 bg-warning/10 text-warning"
                      : t.student_marked
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-input bg-muted/40 text-muted-foreground",
                  )}
                  title={
                    !checked && t.student_marked
                      ? "Öğrenci yaptım olarak işaretledi"
                      : undefined
                  }
                >
                  {((checked && t.completed) || (!checked && t.student_marked)) && (
                    <Check className="h-3 w-3" />
                  )}
                  {label}
                </span>
              );
            })}
          </div>
        ))}

      {checked && homework.feedback && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm">
          <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              Öğretmen notu
            </p>
            <p className="mt-0.5 text-foreground">{homework.feedback}</p>
          </div>
        </div>
      )}

      {homework.attachment_path && homework.attachment_name && (
        <div className="mt-3">
          <AttachmentDownloadLink
            path={homework.attachment_path}
            name={homework.attachment_name}
          />
        </div>
      )}
    </div>
  );
}
