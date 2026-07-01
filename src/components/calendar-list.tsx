import { Badge } from "@/components/ui/badge";
import type { CalendarItem } from "@/lib/calendar";

const TYPE_LABEL: Record<CalendarItem["type"], string> = {
  lesson: "Ders",
  reminder: "Hatırlatma",
  homework_deadline: "Ödev Teslim",
};

const TYPE_VARIANT: Record<CalendarItem["type"], "default" | "outline" | "secondary"> = {
  lesson: "default",
  reminder: "secondary",
  homework_deadline: "outline",
};

export function CalendarList({ items }: { items: CalendarItem[] }) {
  if (items.length === 0) {
    return <p className="text-muted-foreground">Görüntülenecek bir etkinlik yok.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{item.title}</p>
              <Badge variant={TYPE_VARIANT[item.type]} className="sm:hidden">
                {TYPE_LABEL[item.type]}
              </Badge>
            </div>
            {item.description && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {item.description}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end sm:gap-1 sm:text-right">
            <Badge
              variant={TYPE_VARIANT[item.type]}
              className="hidden sm:inline-flex"
            >
              {TYPE_LABEL[item.type]}
            </Badge>
            <span className="text-xs text-muted-foreground sm:text-sm">
              {new Date(item.date).toLocaleString("tr-TR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
