"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  BellRing,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleGauge,
  ClipboardCheck,
  Clock3,
  Eye,
  EyeOff,
  ListChecks,
  SlidersHorizontal,
  Target,
  TimerReset,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { saveDashboardLayout } from "@/lib/actions/dashboard";
import { cn } from "@/lib/utils";
import type {
  DashboardData,
  DashboardSectionId,
  DailyGoalSummary,
  PriorityItem,
  StoredLayoutV2,
} from "@/lib/dashboard-types";

/**
 * Rol dosyalarının (dashboard-home-{student,teacher,parent}) paylaştığı çerçeve
 * ve yardımcılar. Rol bölümleri ayrı client dosyalarında yaşar; sunucu taraflı
 * dashboard-home.tsx role göre yalnız ilgili dosyanın chunk'ını yükletir.
 */

export const SECTION_TITLES: Record<DashboardSectionId, string> = {
  "today-flow": "Bugünün Akışı",
  "homework-plan": "Ödev Planım",
  progress: "İlerlemem",
  pomodoro: "Odak Zamanlayıcısı",
  countdown: "Hedef Geri Sayımı",
  "action-queue": "İşlem Kuyruğu",
  "quick-create": "Hızlı Oluştur",
  "student-radar": "Öğrenci Radarı",
  "today-calendar": "Bugünün Takvimi",
  "weekly-story": "Haftalık Durum Hikâyesi",
  upcoming: "Yaklaşanlar",
  "academic-progress": "Akademik Gelişim",
};

function percent(done: number, goal: number | null) {
  if (!goal) return 0;
  return Math.min(100, Math.round((done / goal) * 100));
}

export function GoalBars({
  goal,
  compact = false,
}: {
  goal: DailyGoalSummary;
  compact?: boolean;
}) {
  if (goal.minutesGoal === null || goal.questionsGoal === null) {
    return (
      <p className="text-sm text-muted-foreground">Henüz günlük hedef belirlenmedi.</p>
    );
  }
  return (
    <div className={cn("grid gap-3", !compact && "sm:grid-cols-2")}>
      {[
        ["Süre", goal.minutesDone, goal.minutesGoal, "dk"],
        ["Soru", goal.questionsDone, goal.questionsGoal, "soru"],
      ].map(([label, done, target, unit]) => (
        <div key={String(label)} className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="font-medium">{label}</span>
            <span className="tabular-nums text-muted-foreground">
              {done}/{target} {unit}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-700 motion-reduce:transition-none"
              style={{ width: `${percent(Number(done), Number(target))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function PriorityIcon({ item }: { item: PriorityItem }) {
  if (item.kind === "success") return <CheckCircle2 className="h-5 w-5" />;
  if (item.kind === "schedule") return <Clock3 className="h-5 w-5" />;
  if (item.kind === "homework") return <ClipboardCheck className="h-5 w-5" />;
  if (item.kind === "announcement") return <BellRing className="h-5 w-5" />;
  if (item.kind === "goal") return <Target className="h-5 w-5" />;
  if (item.kind === "approval") return <BookOpenCheck className="h-5 w-5" />;
  return <AlertCircle className="h-5 w-5" />;
}

function PriorityRow({
  item,
  prominent = false,
}: {
  item: PriorityItem;
  prominent?: boolean;
}) {
  const content = (
    <div className={cn("flex min-w-0 items-center gap-3", prominent && "items-start")}>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-2xl",
          prominent ? "h-12 w-12" : "h-10 w-10",
          item.tone === "urgent" && "bg-destructive/12 text-destructive",
          item.tone === "warning" && "bg-warning/15 text-warning-foreground",
          item.tone === "info" && "bg-primary/10 text-primary",
          item.tone === "success" && "bg-success/12 text-success",
        )}
      >
        <PriorityIcon item={item} />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate font-semibold",
            prominent ? "text-base" : "text-sm",
          )}
        >
          {item.title}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {item.detail}
        </span>
      </span>
      {item.href && <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
    </div>
  );
  return item.href ? (
    <Link
      href={item.href}
      className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {content}
    </Link>
  ) : (
    content
  );
}

function PriorityCard({
  items,
  role,
}: {
  items: PriorityItem[];
  role: DashboardData["role"];
}) {
  const [open, setOpen] = useState(false);
  const main = items[0];
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] border p-4 shadow-sm sm:p-5",
        role === "student" &&
          "border-orange-200/60 bg-gradient-to-br from-orange-50 via-card to-rose-50 dark:border-orange-900/50 dark:from-orange-950/40 dark:to-card",
        role === "teacher" &&
          "border-blue-200/60 bg-gradient-to-br from-blue-50 via-card to-cyan-50 dark:border-blue-900/50 dark:from-blue-950/35 dark:to-card",
        role === "parent" &&
          "border-stone-200/80 bg-gradient-to-br from-stone-50 via-card to-amber-50/60 dark:border-stone-800 dark:from-stone-950/50 dark:to-card",
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-primary/8 blur-2xl" />
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Bugün ve Öncelikler
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Şimdi ilgilenmen gerekenler
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="rounded-full">
              Tümü{" "}
              <span className="ml-1 rounded-full bg-foreground/8 px-1.5 py-0.5 text-[10px]">
                {items.length}
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tüm öncelikler</DialogTitle>
              <DialogDescription>Önem sırasına göre güncel listen.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="rounded-2xl border bg-card p-3">
                  <PriorityRow item={item} />
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-2xl bg-background/80 p-3.5 shadow-sm backdrop-blur-sm">
        <PriorityRow item={main} prominent />
      </div>
      {items.length > 1 && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {items.slice(1, 3).map((item) => (
            <div key={item.id} className="rounded-2xl border bg-background/55 p-3">
              <PriorityRow item={item} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function EmptyLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed p-5 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function SectionCard({
  id,
  collapsed,
  onToggle,
  children,
}: {
  id: DashboardSectionId;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[1.5rem] border bg-card shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-14 w-full items-center gap-3 px-4 text-left sm:px-5"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {id.includes("progress") || id === "student-radar" ? (
            <BarChart3 className="h-4 w-4" />
          ) : id.includes("calendar") || id.includes("flow") || id === "upcoming" ? (
            <CalendarDays className="h-4 w-4" />
          ) : id.includes("queue") || id.includes("homework") ? (
            <ListChecks className="h-4 w-4" />
          ) : id === "pomodoro" ? (
            <TimerReset className="h-4 w-4" />
          ) : id === "countdown" ? (
            <Target className="h-4 w-4" />
          ) : (
            <CircleGauge className="h-4 w-4" />
          )}
        </span>
        <h2 className="flex-1 text-sm font-semibold">{SECTION_TITLES[id]}</h2>
        {collapsed ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {!collapsed && (
        <div className="animate-in fade-in slide-in-from-top-1 px-4 pb-4 duration-200 motion-reduce:animate-none sm:px-5 sm:pb-5">
          {children}
        </div>
      )}
    </section>
  );
}

function LayoutEditor({
  layout,
  onChange,
}: {
  layout: StoredLayoutV2;
  onChange: (layout: StoredLayoutV2) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(layout);
  const [pending, startTransition] = useTransition();
  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= draft.sections.length) return;
    const sections = [...draft.sections];
    [sections[index], sections[target]] = [sections[target], sections[index]];
    setDraft({ ...draft, sections });
  }
  function save() {
    startTransition(async () => {
      try {
        await saveDashboardLayout(draft);
        onChange(draft);
        toast.success("Ana sayfa düzeni kaydedildi.");
        setOpen(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Düzen kaydedilemedi.");
      }
    });
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft(layout);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full">
          <SlidersHorizontal className="mr-1.5 h-4 w-4" />
          Düzenle
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ana sayfayı düzenle</DialogTitle>
          <DialogDescription>
            Öncelikler kartı her zaman ilk sıradadır. Diğer bölümleri sırala, gizle veya
            daralt.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {draft.sections.map((section, index) => {
            const hidden = draft.hidden.includes(section.id);
            return (
              <div
                key={section.id}
                className="flex min-h-14 items-center gap-2 rounded-2xl border p-2"
              >
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      hidden: hidden
                        ? draft.hidden.filter((id) => id !== section.id)
                        : [...draft.hidden, section.id],
                    })
                  }
                  className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-accent"
                  aria-label={hidden ? "Göster" : "Gizle"}
                >
                  {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <span
                  className={cn(
                    "min-w-0 flex-1 text-sm font-medium",
                    hidden && "text-muted-foreground line-through",
                  )}
                >
                  {SECTION_TITLES[section.id]}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      sections: draft.sections.map((item) =>
                        item.id === section.id
                          ? { ...item, collapsed: !item.collapsed }
                          : item,
                      ),
                    })
                  }
                  className="h-9 rounded-lg px-2 text-xs text-muted-foreground hover:bg-accent"
                >
                  {section.collapsed ? "Daraltılmış" : "Açık"}
                </button>
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent disabled:opacity-30"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === draft.sections.length - 1}
                  className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent disabled:opacity-30"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
        <Button onClick={save} disabled={pending}>
          {pending ? "Kaydediliyor…" : "Düzeni kaydet"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Ortak dashboard çerçevesi: başlık, veli çocuk seçici, öncelik kartı ve
 * kişisel düzene göre sıralanan bölüm kartları. Bölüm içerikleri rol
 * dosyasından `renderSection` ile gelir; gizli bölümler hiç mount edilmez.
 */
export function DashboardHomeFrame({
  data,
  initialLayout,
  renderSection,
}: {
  data: DashboardData;
  initialLayout: StoredLayoutV2;
  renderSection: (id: DashboardSectionId) => React.ReactNode;
}) {
  const [layout, setLayout] = useState(initialLayout);
  const [pending, startTransition] = useTransition();
  function toggleSection(id: DashboardSectionId) {
    const next = {
      ...layout,
      sections: layout.sections.map((section) =>
        section.id === id ? { ...section, collapsed: !section.collapsed } : section,
      ),
    };
    setLayout(next);
    startTransition(async () => {
      try {
        await saveDashboardLayout(next);
      } catch {
        toast.error("Bölüm durumu kaydedilemedi.");
      }
    });
  }
  function selectChild(id: string) {
    const next = { ...layout, selectedStudentId: id };
    setLayout(next);
    startTransition(async () => {
      try {
        await saveDashboardLayout(next);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Çocuk seçilemedi.");
      }
    });
  }
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-6xl space-y-4 pb-8",
        pending && "cursor-progress",
      )}
    >
      <header className="flex items-end justify-between gap-3 px-1">
        <div>
          <p className="text-xs font-medium capitalize text-muted-foreground">
            {data.todayLabel}
          </p>
          <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
            {data.role === "student"
              ? "Harika bir gün olsun"
              : data.role === "teacher"
                ? "Kontrol sende"
                : "Günün özeti hazır"}
            , {data.firstName}
          </h1>
        </div>
        <LayoutEditor layout={layout} onChange={setLayout} />
      </header>
      {data.role === "parent" && data.children.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-1 pb-1">
          {data.children.map((child) => (
            <button
              type="button"
              key={child.id}
              onClick={() => selectChild(child.id)}
              className={cn(
                "min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium",
                child.id === data.selectedStudentId
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card",
              )}
            >
              <span>{child.name}</span>
              {child.urgentCount > 0 && (
                <span className="ml-2 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] text-destructive-foreground">
                  {child.urgentCount}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      <PriorityCard items={data.priorities} role={data.role} />
      <div className="grid gap-3 lg:grid-cols-2">
        {layout.sections
          .filter((section) => !layout.hidden.includes(section.id))
          .map((section) => (
            <SectionCard
              key={section.id}
              id={section.id}
              collapsed={section.collapsed}
              onToggle={() => toggleSection(section.id)}
            >
              {renderSection(section.id)}
            </SectionCard>
          ))}
      </div>
    </div>
  );
}
