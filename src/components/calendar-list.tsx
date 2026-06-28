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
          className="flex items-center justify-between gap-4 rounded-md border p-3"
        >
          <div>
            <p className="font-medium">{item.title}</p>
            {item.description && (
              <p className="text-sm text-muted-foreground">{item.description}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            <Badge variant={TYPE_VARIANT[item.type]}>{TYPE_LABEL[item.type]}</Badge>
            <span className="text-sm text-muted-foreground">
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
