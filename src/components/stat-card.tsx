import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground sm:text-sm">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {value}
          </p>
          {hint && (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground sm:h-11 sm:w-11">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
