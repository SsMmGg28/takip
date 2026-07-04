import { cn } from "@/lib/utils";
import type { HomeworkStatus } from "@/lib/types";

export const HOMEWORK_STATUS_LABEL: Record<HomeworkStatus, string> = {
  assigned: "Bekliyor",
  completed: "Tamamlandı",
  incomplete: "Eksik",
  overdue: "Gecikti",
};

const STATUS_CLASS: Record<HomeworkStatus, string> = {
  assigned: "bg-secondary text-secondary-foreground",
  completed: "bg-success/15 text-success",
  incomplete: "bg-warning/15 text-warning",
  overdue: "bg-destructive/12 text-destructive",
};

const DOT_CLASS: Record<HomeworkStatus, string> = {
  assigned: "bg-muted-foreground",
  completed: "bg-success",
  incomplete: "bg-warning",
  overdue: "bg-destructive",
};

export function HomeworkStatusBadge({
  status,
  className,
}: {
  status: HomeworkStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_CLASS[status],
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT_CLASS[status])} />
      {HOMEWORK_STATUS_LABEL[status]}
    </span>
  );
}
