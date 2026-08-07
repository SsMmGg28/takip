"use client";

import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Flame,
  Menu,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GuideMockupKind } from "@/lib/guides";

export function GuideMockup({ kind }: { kind: GuideMockupKind }) {
  return (
    <div
      className="guide-mockup relative mx-auto aspect-[16/10] w-full max-w-2xl overflow-hidden rounded-3xl border bg-background shadow-2xl shadow-primary/10"
      aria-hidden="true"
    >
      <div className="flex h-11 items-center justify-between border-b bg-card/80 px-4">
        <div className="flex items-center gap-2">
          <span className="gradient-surface h-6 w-6 rounded-lg" />
          <span className="h-2.5 w-20 rounded-full bg-foreground/15" />
        </div>
        <div className="flex gap-2">
          <span className="h-7 w-7 rounded-full bg-muted" />
          <span className="h-7 w-7 rounded-full bg-primary/15" />
        </div>
      </div>
      <div className="grid h-[calc(100%-2.75rem)] grid-cols-[4rem_1fr] sm:grid-cols-[8rem_1fr]">
        <div className="space-y-2 border-r bg-muted/25 p-2 sm:p-3">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className={cn(
                "flex h-8 items-center gap-2 rounded-xl px-2",
                item === 0 ? "gradient-surface text-white" : "bg-card",
              )}
            >
              <span className="h-3 w-3 shrink-0 rounded-sm bg-current opacity-70" />
              <span className="hidden h-2 flex-1 rounded-full bg-current opacity-30 sm:block" />
            </div>
          ))}
        </div>
        <div className="relative min-w-0 p-3 sm:p-5">
          {kind === "dashboard" && <DashboardMockup />}
          {kind === "children" && <ChildrenMockup />}
          {kind === "homework" && <HomeworkMockup />}
          {kind === "resources" && <ResourcesMockup />}
          {kind === "schedule" && <ScheduleMockup />}
          {kind === "journal" && <JournalMockup />}
          {kind === "updates" && <UpdatesMockup />}
          {kind === "exams" && <ExamsMockup />}
        </div>
      </div>
      <span className="guide-tap absolute bottom-[24%] right-[22%] h-8 w-8 rounded-full border-2 border-primary/70 bg-primary/15" />
    </div>
  );
}

function MockTitle({ icon: Icon, label }: { icon: typeof Sparkles; label: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <span className="h-2.5 w-28 rounded-full bg-foreground/20" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

function DashboardMockup() {
  return (
    <>
      <MockTitle icon={Sparkles} label="Anasayfa" />
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {[
          ["Bugünün planı", "3 çalışma"],
          ["Ödevler", "2 bekliyor"],
          ["Hedef", "%72"],
          ["Seri", "6 gün"],
        ].map(([label, value], index) => (
          <div
            key={label}
            className={cn(
              "guide-card rounded-2xl border bg-card p-3",
              index === 1 && "[animation-delay:350ms]",
            )}
          >
            <p className="text-[9px] text-muted-foreground sm:text-xs">{label}</p>
            <p className="mt-1 text-xs font-bold sm:text-base">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-2xl bg-primary/8 p-3">
        <Menu className="h-4 w-4 text-primary" />
        <span className="h-2 flex-1 rounded-full bg-primary/20" />
        <ChevronRight className="h-4 w-4 text-primary" />
      </div>
    </>
  );
}

function ChildrenMockup() {
  return (
    <>
      <MockTitle icon={Users} label="Çocuk özeti" />
      <div className="mb-3 flex gap-2">
        {["Ece", "Mert"].map((name, index) => (
          <span
            key={name}
            className={cn(
              "rounded-full border px-3 py-1 text-[9px] font-semibold sm:text-xs",
              index === 0 && "gradient-surface border-transparent text-white",
            )}
          >
            {name}
          </span>
        ))}
      </div>
      <div className="guide-card rounded-2xl border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold sm:text-sm">Bu haftanın özeti</p>
            <p className="mt-1 text-[9px] text-muted-foreground sm:text-xs">
              4 ödev · 12 test · 5 çalışma günü
            </p>
          </div>
          <Sparkles className="h-5 w-5 text-warning" />
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div className="guide-progress gradient-surface h-full rounded-full" />
        </div>
      </div>
    </>
  );
}

function HomeworkMockup() {
  return (
    <>
      <MockTitle icon={ClipboardCheck} label="Ödevler" />
      <div className="space-y-2">
        {["Matematik · Test 4", "Türkçe · Test 7", "Fen · Test 2"].map((label, index) => (
          <div
            key={label}
            className="flex items-center gap-2 rounded-2xl border bg-card p-2.5 sm:p-3"
          >
            <span
              className={cn(
                "guide-check flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
                index === 0 &&
                  "border-primary bg-primary text-primary-foreground [animation-delay:500ms]",
              )}
            >
              {index === 0 ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-[9px] font-medium sm:text-xs">
              {label}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function ResourcesMockup() {
  return (
    <>
      <MockTitle icon={BookOpen} label="Kitaplık" />
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {[42, 76].map((progress, index) => (
          <div key={progress} className="guide-card rounded-2xl border bg-card p-3">
            <span
              className={cn(
                "mb-3 block h-10 w-8 rounded-md",
                index ? "bg-brand-to/35" : "bg-primary/30",
              )}
            />
            <span className="block h-2 w-16 rounded-full bg-foreground/15" />
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="guide-progress gradient-surface h-full rounded-full"
                style={{ "--guide-progress": `${progress}%` } as React.CSSProperties}
              />
            </div>
            <p className="mt-1 text-right text-[8px] text-muted-foreground sm:text-[10px]">
              %{progress}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}

function ScheduleMockup() {
  return (
    <>
      <MockTitle icon={Clock3} label="Program" />
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {["Pzt", "Sal", "Çar"].map((day, dayIndex) => (
          <div key={day} className="rounded-2xl border bg-card p-2">
            <p className="mb-2 text-center text-[8px] font-bold sm:text-[10px]">{day}</p>
            <div
              className={cn(
                "guide-card h-12 rounded-xl bg-primary/12 p-1.5",
                dayIndex === 1 && "[animation-delay:400ms]",
              )}
            >
              <span className="block h-1.5 w-full rounded bg-primary/30" />
              <span className="mt-2 block h-1.5 w-2/3 rounded bg-primary/20" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function JournalMockup() {
  return (
    <>
      <MockTitle icon={Flame} label="Çalışma günlüğü" />
      <div className="flex items-center gap-3 rounded-2xl border bg-card p-4">
        <span className="gradient-surface flex h-12 w-12 items-center justify-center rounded-2xl text-white">
          <Flame className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xl font-bold">6 gün</p>
          <p className="text-[9px] text-muted-foreground sm:text-xs">
            Güncel çalışma serisi
          </p>
        </div>
      </div>
    </>
  );
}

function UpdatesMockup() {
  return (
    <>
      <MockTitle icon={Bell} label="Gelişmeler" />
      <div className="space-y-2">
        {[
          [CalendarDays, "Yarın · Matematik ödevi"],
          [Bell, "Yeni duyuru yayınlandı"],
          [BarChart3, "Deneme analizin hazır"],
        ].map(([Icon, label], index) => {
          const ItemIcon = Icon as typeof Bell;
          return (
            <div
              key={label as string}
              className={cn(
                "guide-card flex items-center gap-3 rounded-2xl border bg-card p-3",
                index === 1 && "[animation-delay:300ms]",
              )}
            >
              <ItemIcon className="h-4 w-4 text-primary" />
              <span className="text-[9px] font-medium sm:text-xs">{label as string}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

function ExamsMockup() {
  return (
    <>
      <MockTitle icon={BarChart3} label="Deneme analizi" />
      <div className="relative h-28 rounded-2xl border bg-card p-3 sm:h-36">
        <div className="absolute inset-x-4 bottom-5 top-4 border-b border-l border-border" />
        <svg
          className="absolute inset-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)]"
          viewBox="0 0 240 100"
        >
          <path
            className="guide-chart-line"
            d="M4 82 C45 78, 55 55, 88 60 S135 38, 156 45 S205 18, 236 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </>
  );
}
