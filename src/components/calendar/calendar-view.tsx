"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CalendarItem } from "@/lib/calendar";

type ViewMode = "day" | "week" | "month";

const TYPE_LABEL: Record<CalendarItem["type"], string> = {
  lesson: "Ders",
  reminder: "Hatırlatma",
  homework_deadline: "Ödev",
};

const TYPE_TONE: Record<CalendarItem["type"], string> = {
  lesson: "bg-primary/10 text-primary border-primary/20",
  reminder: "bg-secondary text-secondary-foreground border-border",
  homework_deadline: "bg-accent text-accent-foreground border-accent",
};

const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const DAY_NAMES_LONG = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];
const MONTH_NAMES = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const dow = (x.getDay() + 6) % 7; // Mon=0
  x.setDate(x.getDate() - dow);
  return x;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CalendarView({ items }: { items: CalendarItem[] }) {
  const [view, setView] = useState<ViewMode>("week");
  const [anchor, setAnchor] = useState<Date>(() => startOfDay(new Date()));

  // Group items by yyyy-mm-dd for fast lookup
  const itemsByDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const it of items) {
      const d = new Date(it.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    return map;
  }, [items]);

  function itemsFor(d: Date) {
    return itemsByDay.get(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`) ?? [];
  }

  function nav(dir: -1 | 1) {
    if (view === "day") setAnchor(addDays(anchor, dir));
    else if (view === "week") setAnchor(addDays(anchor, dir * 7));
    else setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1));
  }

  let title = "";
  if (view === "day") {
    title = anchor.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } else if (view === "week") {
    const ws = startOfWeek(anchor);
    const we = addDays(ws, 6);
    if (ws.getMonth() === we.getMonth()) {
      title = `${ws.getDate()} – ${we.getDate()} ${MONTH_NAMES[we.getMonth()]} ${we.getFullYear()}`;
    } else {
      title = `${ws.getDate()} ${MONTH_NAMES[ws.getMonth()]} – ${we.getDate()} ${MONTH_NAMES[we.getMonth()]} ${we.getFullYear()}`;
    }
  } else {
    title = `${MONTH_NAMES[anchor.getMonth()]} ${anchor.getFullYear()}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => nav(-1)} aria-label="Önceki">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAnchor(startOfDay(new Date()))}
          >
            Bugün
          </Button>
          <Button variant="outline" size="icon" onClick={() => nav(1)} aria-label="Sonraki">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <p className="ml-2 truncate text-sm font-medium sm:ml-3 sm:text-base">
            {title}
          </p>
        </div>

        <div className="inline-flex w-full rounded-md border bg-background p-0.5 text-sm sm:w-fit">
          {(["day", "week", "month"] as ViewMode[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                "flex-1 rounded-sm px-3 py-1 font-medium transition-colors sm:flex-none",
                view === v
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {v === "day" ? "Gün" : v === "week" ? "Hafta" : "Ay"}
            </button>
          ))}
        </div>
      </div>

      {view === "day" && <DayView day={anchor} items={itemsFor(anchor)} />}
      {view === "week" && (
        <WeekView
          weekStart={startOfWeek(anchor)}
          itemsFor={itemsFor}
          onDayClick={(d) => {
            setAnchor(d);
            setView("day");
          }}
        />
      )}
      {view === "month" && (
        <MonthView
          anchor={anchor}
          itemsByDay={itemsByDay}
          onDayClick={(d) => {
            setAnchor(d);
            setView("day");
          }}
        />
      )}
    </div>
  );
}

function ItemRow({ item, compact }: { item: CalendarItem; compact?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-md border px-2 py-1.5 text-xs",
        TYPE_TONE[item.type],
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{fmtTime(item.date)}</span>
        {!compact && (
          <Badge variant="outline" className="text-[10px]">
            {TYPE_LABEL[item.type]}
          </Badge>
        )}
      </div>
      <p className={cn("font-medium", compact && "truncate")}>{item.title}</p>
      {!compact && item.description && (
        <p className="mt-0.5 text-muted-foreground">{item.description}</p>
      )}
    </div>
  );
}

function DayView({ day, items }: { day: Date; items: CalendarItem[] }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="mb-3 text-sm font-medium text-muted-foreground">
        {DAY_NAMES_LONG[(day.getDay() + 6) % 7]}
      </p>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Bu gün için etkinlik yok.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <ItemRow key={it.id} item={it} />
          ))}
        </div>
      )}
    </div>
  );
}

function WeekView({
  weekStart,
  itemsFor,
  onDayClick,
}: {
  weekStart: Date;
  itemsFor: (d: Date) => CalendarItem[];
  onDayClick: (d: Date) => void;
}) {
  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
      {days.map((d, i) => {
        const dayItems = itemsFor(d);
        const isToday = sameDay(d, today);
        return (
          <button
            key={i}
            type="button"
            onClick={() => onDayClick(d)}
            className={cn(
              "flex min-h-[120px] flex-col gap-2 rounded-lg border bg-background p-2.5 text-left transition-colors hover:border-primary/40 sm:min-h-[140px] sm:p-3",
              isToday && "border-primary",
            )}
          >
            <div className="flex items-baseline justify-between">
              <span className="text-xs uppercase text-muted-foreground">
                {DAY_NAMES[i]}
              </span>
              <span
                className={cn(
                  "text-lg font-semibold",
                  isToday && "text-primary",
                )}
              >
                {d.getDate()}
              </span>
            </div>
            {dayItems.length === 0 ? (
              <span className="text-xs text-muted-foreground">—</span>
            ) : (
              <div className="space-y-1.5">
                {dayItems.slice(0, 3).map((it) => (
                  <ItemRow key={it.id} item={it} compact />
                ))}
                {dayItems.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{dayItems.length - 3} daha
                  </p>
                )}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function MonthView({
  anchor,
  itemsByDay,
  onDayClick,
}: {
  anchor: Date;
  itemsByDay: Map<string, CalendarItem[]>;
  onDayClick: (d: Date) => void;
}) {
  const today = startOfDay(new Date());
  const monthStart = startOfMonth(anchor);
  const gridStart = startOfWeek(monthStart);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {DAY_NAMES.map((n) => (
          <div key={n}>{n}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          const inMonth = d.getMonth() === anchor.getMonth();
          const isToday = sameDay(d, today);
          const list =
            itemsByDay.get(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`) ?? [];
          return (
            <button
              key={i}
              type="button"
              onClick={() => onDayClick(d)}
              className={cn(
                "flex h-14 flex-col items-start gap-1 rounded-md border bg-background p-1 text-left transition-colors hover:border-primary/40 sm:h-20 sm:p-1.5",
                !inMonth && "opacity-40",
                isToday && "border-primary",
              )}
            >
              <span
                className={cn(
                  "text-xs font-medium",
                  isToday && "text-primary",
                )}
              >
                {d.getDate()}
              </span>
              {list.length > 0 && (
                <div className="flex flex-wrap gap-0.5">
                  {list.slice(0, 3).map((it) => (
                    <span
                      key={it.id}
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        it.type === "lesson" && "bg-primary",
                        it.type === "reminder" && "bg-muted-foreground",
                        it.type === "homework_deadline" && "bg-accent-foreground",
                      )}
                    />
                  ))}
                  {list.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">+{list.length - 3}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
