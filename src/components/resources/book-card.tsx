import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Ortak kitap kartı. href verilirse tamamı tıklanabilir; verilmezse
 * footer'daki aksiyonlarla kullanılır. completedCount verilirse ilerleme
 * çubuğu gösterir.
 */
export function BookCard({
  href,
  name,
  subject,
  sectionCount,
  testCount,
  completedCount,
  badge,
  footer,
  className,
}: {
  href?: string;
  name: string;
  subject: string | null;
  sectionCount: number;
  testCount: number;
  completedCount?: number;
  badge?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  const showProgress = typeof completedCount === "number";
  const percent =
    showProgress && testCount > 0 ? Math.round((completedCount / testCount) * 100) : 0;

  const body = (
    <div
      className={cn(
        "hover-lift group flex h-full flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm",
        href && "transition-colors hover:border-primary/40",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-3">
          <span className="gradient-surface flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md shadow-primary/20">
            <BookOpen className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold leading-tight">{name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {subject ?? "Genel"}
            </p>
          </div>
        </div>
        {href ? (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        ) : (
          badge
        )}
      </div>

      {href && badge}

      {showProgress ? (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {completedCount} / {testCount} test
            </span>
            <span className="font-medium text-foreground">%{percent}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="gradient-surface h-full rounded-full transition-all duration-700"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">{sectionCount} bölüm</Badge>
          <Badge variant="outline">{testCount} test</Badge>
        </div>
        {footer}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {body}
      </Link>
    );
  }
  return body;
}
