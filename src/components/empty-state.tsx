import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="animate-scale-in flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed bg-muted/30 p-10 text-center sm:p-14">
      {Icon && (
        <div className="animate-float gradient-surface flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg shadow-primary/20">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        {description && (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
