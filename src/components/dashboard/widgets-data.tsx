"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BookCheck,
  BookOpen,
  BookX,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  MailQuestion,
  PencilLine,
  Presentation,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DAY_LABELS } from "@/lib/schedule";
import { useNow } from "@/components/dashboard/hooks";
import type { NotificationType } from "@/lib/types";
import type { WidgetProps } from "@/components/dashboard/types";

// ─── Ortak küçük parçalar ────────────────────────────────────────────────────

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center px-4 text-center">
      <p className="text-xs text-muted-foreground">{text}</p>
    </div>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mt-auto flex items-center justify-end gap-1 pt-1.5 text-[11px] font-medium text-primary hover:underline"
    >
      {label} <ArrowRight className="h-3 w-3" />
    </Link>
  );
}

function NameTag({ name }: { name?: string }) {
  if (!name) return null;
  return (
    <span className="shrink-0 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">
      {name}
    </span>
  );
}

function formatDay(iso: string): { label: string; urgent: boolean } {
  const date = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (diffDays < 0) return { label: "Gecikti", urgent: true };
  if (diffDays === 0) return { label: "Bugün", urgent: true };
  if (diffDays === 1) return { label: "Yarın", urgent: false };
  return {
    label: date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }),
    urgent: false,
  };
}

// ─── Özet İstatistikler ──────────────────────────────────────────────────────

export function StatsWidget({ data, w }: WidgetProps) {
  return (
    <div
      className={cn(
        "grid h-full content-center gap-2",
        w >= 3 ? "grid-cols-4" : "grid-cols-2",
      )}
    >
      {data.stats.map((s) => {
        const inner = (
          <>
            <p className="truncate text-2xl font-bold tabular-nums tracking-tight">
              {s.value}
            </p>
            <p className="truncate text-[11px] font-medium text-muted-foreground">
              {s.label}
            </p>
            {s.hint && (
              <p className="truncate text-[10px] text-muted-foreground/70">{s.hint}</p>
            )}
          </>
        );
        const tileClass =
          "flex min-w-0 flex-col justify-center rounded-xl border bg-muted/30 px-3 py-2";
        return s.href ? (
          <Link
            key={s.label}
            href={s.href}
            className={cn(tileClass, "transition-colors hover:border-primary/40 hover:bg-accent/50")}
          >
            {inner}
          </Link>
        ) : (
          <div key={s.label} className={tileClass}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}

// ─── Bekleyen Ödevler ────────────────────────────────────────────────────────

export function HomeworkWidget({ data, h }: WidgetProps) {
  const items = data.homework.slice(0, h >= 3 ? 8 : h === 2 ? 4 : 2);
  if (!items.length) {
    return <EmptyState text="Bekleyen ödev yok — hepsi tamam! 🎉" />;
  }
  return (
    <div className="flex h-full flex-col">
      <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto">
        {items.map((hw) => {
          const due = hw.dueDate ? formatDay(hw.dueDate) : null;
          return (
            <li key={hw.id}>
              <Link
                href={`/${data.role}/homework`}
                className="flex items-center gap-2 rounded-xl border bg-muted/30 px-2.5 py-2 transition-colors hover:bg-accent/60"
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                    hw.status === "incomplete" || hw.status === "overdue"
                      ? "bg-destructive/12 text-destructive"
                      : "bg-primary/12 text-primary",
                  )}
                >
                  {hw.status === "incomplete" ? (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  ) : (
                    <ClipboardList className="h-3.5 w-3.5" />
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-medium">{hw.title}</span>
                <NameTag name={hw.studentName} />
                {due && (
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      due.urgent
                        ? "bg-destructive/12 text-destructive"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {due.label}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
      <FooterLink href={`/${data.role}/homework`} label="Tüm ödevler" />
    </div>
  );
}

// ─── Bugünün Programı ────────────────────────────────────────────────────────

export function TodayScheduleWidget({ data, h }: WidgetProps) {
  // Hydration uyumu için "şimdi" işareti yalnızca istemcide hesaplanır.
  const nowDate = useNow(30_000);
  const now = nowDate ? nowDate.toTimeString().slice(0, 5) : null;

  const todayIdx = ((nowDate ?? new Date()).getDay() + 6) % 7;
  const items = data.schedule
    .filter((s) => s.day === todayIdx)
    .slice(0, h >= 3 ? 8 : h === 2 ? 4 : 2);

  if (!items.length) {
    return <EmptyState text={`Bugün (${DAY_LABELS[todayIdx]}) programda etkinlik yok.`} />;
  }

  return (
    <div className="flex h-full flex-col">
      <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto">
        {items.map((s) => {
          const active = now !== null && s.start <= now && now < s.end;
          return (
            <li key={s.id}>
              <Link
                href={`/${data.role}/schedule`}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors hover:bg-accent/60",
                  active ? "border-primary/40 bg-primary/8" : "bg-muted/30",
                )}
              >
                <span className="shrink-0 text-[11px] font-semibold tabular-nums text-muted-foreground">
                  {s.start}–{s.end}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-medium">{s.label}</span>
                <NameTag name={s.studentName} />
                {active && (
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping-soft absolute h-2 w-2 rounded-full bg-primary/60" />
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
      <FooterLink href={`/${data.role}/schedule`} label="Tüm program" />
    </div>
  );
}

// ─── Haftalık Program ────────────────────────────────────────────────────────

export function WeeklyScheduleWidget({ data }: WidgetProps) {
  const todayIdx = (new Date().getDay() + 6) % 7;
  const counts = Array.from({ length: 7 }, (_, day) =>
    data.schedule.filter((s) => s.day === day).length,
  );
  const max = Math.max(1, ...counts);

  if (!data.schedule.length) {
    return <EmptyState text="Haftalık çalışma programı henüz boş." />;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="grid min-h-0 flex-1 grid-cols-7 items-end gap-1.5 pb-1">
        {counts.map((count, day) => (
          <div key={day} className="flex h-full flex-col items-center justify-end gap-1">
            <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
              {count || ""}
            </span>
            <div
              style={{ height: `${Math.max(8, (count / max) * 100)}%` }}
              className={cn(
                "w-full max-w-6 rounded-md",
                count === 0
                  ? "bg-muted"
                  : day === todayIdx
                    ? "gradient-surface"
                    : "bg-primary/25",
              )}
            />
            <span
              className={cn(
                "text-[10px] font-medium",
                day === todayIdx ? "text-primary" : "text-muted-foreground",
              )}
            >
              {DAY_LABELS[day].slice(0, 3)}
            </span>
          </div>
        ))}
      </div>
      <FooterLink
        href={`/${data.role}/schedule`}
        label={`Haftada ${data.schedule.length} etkinlik`}
      />
    </div>
  );
}

// ─── Yaklaşan Etkinlikler ────────────────────────────────────────────────────

const EVENT_ICON: Record<string, LucideIcon> = {
  lesson: Presentation,
  reminder: Bell,
  homework_deadline: ClipboardList,
};

const EVENT_TONE: Record<string, string> = {
  lesson: "bg-primary/12 text-primary",
  reminder: "bg-warning/15 text-warning",
  homework_deadline: "bg-destructive/12 text-destructive",
};

export function EventsWidget({ data, h }: WidgetProps) {
  const items = data.events.slice(0, h >= 3 ? 8 : h === 2 ? 4 : 2);
  if (!items.length) {
    return <EmptyState text="Yaklaşan etkinlik yok." />;
  }
  return (
    <div className="flex h-full flex-col">
      <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto">
        {items.map((e) => {
          const Icon = EVENT_ICON[e.type] ?? CalendarDays;
          const day = formatDay(e.date);
          return (
            <li key={e.id}>
              <Link
                href={`/${data.role}/calendar`}
                className="flex items-center gap-2 rounded-xl border bg-muted/30 px-2.5 py-2 transition-colors hover:bg-accent/60"
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                    EVENT_TONE[e.type] ?? "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-medium">{e.title}</span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    day.urgent
                      ? "bg-primary/12 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {day.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <FooterLink href={`/${data.role}/calendar`} label="Takvimi aç" />
    </div>
  );
}

// ─── Son Denemeler ───────────────────────────────────────────────────────────

export function ExamsWidget({ data, h }: WidgetProps) {
  const items = data.exams.slice(0, h >= 3 ? 6 : h === 2 ? 4 : 2);
  if (!items.length) {
    return <EmptyState text="Henüz deneme sonucu girilmemiş." />;
  }
  const maxNet = Math.max(1, ...items.map((e) => e.totalNet));

  return (
    <div className="flex h-full flex-col">
      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {items.map((exam, i) => {
          const prev = items[i + 1];
          const delta = prev ? exam.totalNet - prev.totalNet : null;
          // Deneme detayı yalnızca öğrenci rotasında doğrudan adreslenebilir;
          // öğretmen/veli için analiz sayfasına gidilir.
          const examHref =
            data.role === "student" ? `/student/exams/${exam.id}` : `/${data.role}/exams`;
          return (
            <li key={exam.id}>
              <Link href={examHref} className="block space-y-1 rounded-lg p-0.5 transition-colors hover:bg-accent/50">
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-xs font-medium">
                  {exam.name}
                </span>
                <NameTag name={exam.studentName} />
                {delta !== null && delta !== 0 && (
                  <span
                    className={cn(
                      "shrink-0 text-[10px] font-bold",
                      delta > 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    {delta > 0 ? "▲" : "▼"} {Math.abs(Math.round(delta * 10) / 10)}
                  </span>
                )}
                <span className="shrink-0 text-xs font-bold tabular-nums">
                  {exam.totalNet} net
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="gradient-surface h-full rounded-full"
                  style={{ width: `${(exam.totalNet / maxNet) * 100}%` }}
                />
              </div>
              </Link>
            </li>
          );
        })}
      </ul>
      <FooterLink href={`/${data.role}/exams`} label="Deneme analizi" />
    </div>
  );
}

// ─── Kitap İlerlemesi ────────────────────────────────────────────────────────

export function BooksWidget({ data, h }: WidgetProps) {
  const items = data.books.slice(0, h >= 3 ? 6 : h === 2 ? 4 : 2);
  if (!items.length) {
    return <EmptyState text="Kitaplıkta henüz kitap yok." />;
  }
  return (
    <div className="flex h-full flex-col">
      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {items.map((b) => {
          const pct = b.total > 0 ? Math.round((b.done / b.total) * 100) : 0;
          return (
            <li key={b.id}>
              <Link
                href={`/${data.role}/resources`}
                className="block space-y-1 rounded-lg p-0.5 transition-colors hover:bg-accent/50"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium">{b.name}</span>
                  <NameTag name={b.studentName} />
                  <span className="shrink-0 text-[11px] font-semibold tabular-nums text-muted-foreground">
                    {b.done}/{b.total} · %{pct}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      pct >= 100 ? "bg-success" : "gradient-surface",
                    )}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      <FooterLink href={`/${data.role}/resources`} label="Kitaplık" />
    </div>
  );
}

// ─── Son Bildirimler ─────────────────────────────────────────────────────────

const NOTIF_ICON: Record<NotificationType, LucideIcon> = {
  homework_assigned: ClipboardList,
  homework_updated: PencilLine,
  homework_incomplete: AlertTriangle,
  book_pending: BookOpen,
  book_approved: BookCheck,
  book_rejected: BookX,
  exam_created: GraduationCap,
  exam_edit_requested: MailQuestion,
  exam_edit_resolved: PencilLine,
  homework_due_soon: AlertTriangle,
  event_created: CalendarDays,
  bug_report: AlertTriangle,
  announcement_created: Bell,
};

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "şimdi";
  if (mins < 60) return `${mins} dk`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} sa`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} gün`;
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export function NotificationsWidget({ data, h }: WidgetProps) {
  const items = data.notifications.slice(0, h >= 3 ? 8 : h === 2 ? 4 : 2);
  if (!items.length) {
    return <EmptyState text="Henüz bildirim yok." />;
  }
  return (
    <ul className="h-full space-y-1.5 overflow-y-auto">
      {items.map((n) => {
        const Icon = NOTIF_ICON[n.type] ?? Bell;
        const inner = (
          <>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium">{n.title}</span>
              {n.body && (
                <span className="block truncate text-[11px] text-muted-foreground">
                  {n.body}
                </span>
              )}
            </span>
            <span className="shrink-0 text-[10px] text-muted-foreground/70">
              {timeAgo(n.created_at)}
            </span>
          </>
        );
        return (
          <li key={n.id}>
            {n.link ? (
              <Link
                href={n.link}
                className="flex items-center gap-2 rounded-xl border bg-muted/30 px-2.5 py-2 hover:bg-accent/60"
              >
                {inner}
              </Link>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border bg-muted/30 px-2.5 py-2">
                {inner}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// ─── Onay Bekleyen Kitaplar (öğretmen) ───────────────────────────────────────

export function PendingBooksWidget({ data, h }: WidgetProps) {
  const items = data.pendingBooks.slice(0, h >= 2 ? 5 : 2);
  if (!items.length) {
    return <EmptyState text="Onay bekleyen kitap yok. 👌" />;
  }
  return (
    <div className="flex h-full flex-col">
      <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto">
        {items.map((b) => (
          <li
            key={b.id}
            className="flex items-center gap-2 rounded-xl border bg-muted/30 px-2.5 py-2"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning">
              <BookOpen className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0 flex-1 truncate text-xs font-medium">{b.name}</span>
            {b.subject && (
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {b.subject}
              </span>
            )}
          </li>
        ))}
      </ul>
      <FooterLink href="/teacher/resources" label="Onaya git" />
    </div>
  );
}

// ─── Öğrencilerim / Çocuklarım ───────────────────────────────────────────────

export function PeopleWidget({ data, h }: WidgetProps) {
  const items = data.people.slice(0, h >= 3 ? 8 : h === 2 ? 4 : 2);
  if (!items.length) {
    return (
      <EmptyState
        text={
          data.role === "teacher"
            ? "Henüz öğrenci eklenmemiş."
            : "Henüz bir öğrenciyle eşleştirilmedin."
        }
      />
    );
  }
  const linkBase = data.role === "teacher" ? "/teacher/students" : null;
  return (
    <div className="flex h-full flex-col">
      <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto">
        {items.map((p) => {
          const inner = (
            <>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <GraduationCap className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1 truncate text-xs font-medium">{p.name}</span>
              {p.grade !== null && (
                <span className="shrink-0 rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {p.grade}. sınıf
                </span>
              )}
            </>
          );
          return (
            <li key={p.id}>
              {linkBase ? (
                <Link
                  href={`${linkBase}/${p.id}`}
                  className="flex items-center gap-2 rounded-xl border bg-muted/30 px-2.5 py-2 hover:bg-accent/60"
                >
                  {inner}
                </Link>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border bg-muted/30 px-2.5 py-2">
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {linkBase && <FooterLink href={linkBase} label="Tüm öğrenciler" />}
    </div>
  );
}

// ─── Haftalık Özet (veli) ────────────────────────────────────────────────────

export function WeeklySummaryWidget({ data }: WidgetProps) {
  const summaries = data.weeklySummary;
  if (!summaries.length) {
    return <EmptyState text="Haftalık özet için bağlı bir öğrenci gerekli." />;
  }
  return (
    <div className="flex h-full flex-col">
      <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto">
        {summaries.map((s) => (
          <li
            key={s.studentId}
            className="rounded-xl border bg-muted/30 px-2.5 py-2 transition-colors hover:bg-accent/50"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs font-semibold">{s.studentName}</span>
              {s.netChange !== null && (
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    s.netChange > 0
                      ? "bg-success/15 text-success"
                      : s.netChange < 0
                        ? "bg-destructive/12 text-destructive"
                        : "bg-accent text-accent-foreground",
                  )}
                  title="Son iki denemenin toplam net farkı"
                >
                  {s.netChange > 0 ? "+" : ""}
                  {s.netChange} net
                </span>
              )}
            </div>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5 text-center">
              <div className="rounded-lg bg-background/60 px-1 py-1">
                <p className="text-sm font-bold tabular-nums">{s.completedHomework}</p>
                <p className="text-[10px] text-muted-foreground">Tam. ödev</p>
              </div>
              <div className="rounded-lg bg-background/60 px-1 py-1">
                <p className="text-sm font-bold tabular-nums">{s.incompleteHomework}</p>
                <p className="text-[10px] text-muted-foreground">Eksik ödev</p>
              </div>
              <div className="rounded-lg bg-background/60 px-1 py-1">
                <p className="text-sm font-bold tabular-nums">{s.testsSolved}</p>
                <p className="text-[10px] text-muted-foreground">Çözülen test</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <FooterLink href="/parent/homework" label="Ödevler" />
    </div>
  );
}
