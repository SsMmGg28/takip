import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Flame,
  LayoutDashboard,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GuideScene, GuideSceneKind } from "@/lib/guides";

function MiniHeader({ title, icon: Icon }: { title: string; icon: typeof Sparkles }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-white">
        <span className="flex size-7 items-center justify-center rounded-lg bg-white/15">
          <Icon className="size-3.5" />
        </span>
        {title}
      </div>
      <span className="guide-demo-pulse flex size-7 items-center justify-center rounded-full bg-white/10">
        <Bell className="size-3.5 text-white/80" />
      </span>
    </div>
  );
}

function ProgressBar({ value, delay = "0s" }: { value: string; delay?: string }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
      <div
        className="guide-demo-progress h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-300"
        style={
          { "--guide-progress": value, animationDelay: delay } as React.CSSProperties
        }
      />
    </div>
  );
}

function DashboardDemo({ parent = false }: { parent?: boolean }) {
  const items = parent
    ? [
        ["Çocuk", "2", Users],
        ["Bekleyen", "3", ClipboardCheck],
        ["Program", "6", CalendarDays],
      ]
    : [
        ["Ödev", "3", ClipboardCheck],
        ["Seri", "5", Flame],
        ["Program", "4", CalendarDays],
      ];
  return (
    <>
      <MiniHeader
        title={parent ? "Veli Paneli" : "Öğrenci Paneli"}
        icon={LayoutDashboard}
      />
      <div className="grid grid-cols-3 gap-2 p-3">
        {items.map(([label, value, Icon], index) => (
          <div
            key={label as string}
            className="guide-demo-card rounded-xl border border-white/10 bg-white/10 p-2.5"
            style={{ animationDelay: `${index * 120}ms` }}
          >
            <Icon className="mb-2 size-4 text-cyan-200" />
            <p className="text-lg font-bold text-white">{value as string}</p>
            <p className="text-[9px] text-white/60">{label as string}</p>
          </div>
        ))}
      </div>
      <div className="mx-3 rounded-xl border border-white/10 bg-black/10 p-3">
        <div className="mb-3 flex items-center justify-between text-[10px] text-white/70">
          <span>{parent ? "Haftalık özet" : "Bugünkü ilerleme"}</span>
          <Sparkles className="size-3.5 text-violet-200" />
        </div>
        <ProgressBar value={parent ? "72%" : "64%"} />
      </div>
    </>
  );
}

function HomeworkDemo() {
  return (
    <>
      <MiniHeader title="Ödevler" icon={ClipboardCheck} />
      <div className="space-y-2 p-3">
        {["Matematik · Test 12", "Fen · Kuvvet ve Hareket", "Türkçe · Paragraf"].map(
          (label, index) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl bg-white/10 p-3"
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-lg border border-white/20",
                  index === 0 && "guide-demo-check bg-emerald-400 text-emerald-950",
                )}
              >
                {index === 0 && <Check className="size-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-medium text-white">{label}</p>
                <p className="mt-1 text-[9px] text-white/55">
                  {index === 0 ? "Yapıldı · kontrol bekliyor" : "Cuma gününe kadar"}
                </p>
              </div>
              <Clock3 className="size-3.5 text-white/45" />
            </div>
          ),
        )}
      </div>
    </>
  );
}

function ResourcesDemo() {
  return (
    <>
      <MiniHeader title="Kitaplık" icon={BookOpen} />
      <div className="grid grid-cols-2 gap-2 p-3">
        {[
          ["Matematik Soru Bankası", "18 / 30", "60%"],
          ["Fen Bilimleri", "9 / 24", "38%"],
        ].map(([name, count, progress], index) => (
          <div key={name} className="guide-demo-card rounded-xl bg-white/10 p-3">
            <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-violet-300/20 text-violet-100">
              <BookOpen className="size-4" />
            </div>
            <p className="min-h-7 text-[10px] font-medium leading-tight text-white">
              {name}
            </p>
            <p className="my-2 text-[9px] text-white/55">{count} test</p>
            <ProgressBar value={progress} delay={`${index * 180}ms`} />
          </div>
        ))}
      </div>
      <div className="guide-demo-tap absolute bottom-7 right-9 flex size-8 items-center justify-center rounded-full bg-cyan-300 text-cyan-950 shadow-lg shadow-cyan-300/30">
        <Check className="size-4" />
      </div>
    </>
  );
}

function ScheduleDemo({ journal = false }: { journal?: boolean }) {
  return (
    <>
      <MiniHeader
        title={journal ? "Çalışma Günlüğü" : "Çalışma Programı"}
        icon={journal ? Flame : CalendarDays}
      />
      {journal ? (
        <div className="p-3">
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-orange-300/15 p-3 text-center">
              <Flame className="guide-demo-float mx-auto size-7 text-orange-200" />
              <p className="mt-1 text-2xl font-bold text-white">5</p>
              <p className="text-[9px] text-white/55">günlük seri</p>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-[9px] text-white/55">Bu hafta</p>
              <p className="mt-2 text-lg font-bold text-white">210 dk</p>
              <ProgressBar value="70%" />
            </div>
          </div>
          <div className="guide-demo-card flex items-center gap-3 rounded-xl bg-white/10 p-3">
            <span className="flex size-8 items-center justify-center rounded-lg bg-cyan-300/20 text-cyan-100">
              <Clock3 className="size-4" />
            </span>
            <div>
              <p className="text-[10px] font-medium text-white">Matematik · Kesirler</p>
              <p className="text-[9px] text-white/55">45 dakika · 30 soru</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-1.5 p-3">
          {["Pzt", "Sal", "Çar", "Per", "Cum"].map((day, dayIndex) => (
            <div key={day} className="space-y-1.5 text-center">
              <p className="text-[9px] text-white/55">{day}</p>
              {[0, 1, 2].map((row) => (
                <div
                  key={row}
                  className={cn(
                    "h-9 rounded-lg border border-white/10",
                    (dayIndex + row) % 3 === 0
                      ? "guide-demo-card bg-cyan-300/25"
                      : "bg-white/5",
                  )}
                  style={{ animationDelay: `${(dayIndex + row) * 60}ms` }}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function UpdatesDemo() {
  return (
    <>
      <MiniHeader title="Gelişmeler" icon={Bell} />
      <div className="space-y-2 p-3">
        {[
          [CalendarDays, "Yarın 17.00 · Matematik dersi", "Takvim"],
          [Megaphone, "Haftalık çalışma duyurusu", "Duyuru"],
          [ClipboardCheck, "Yeni ödevin var", "Bildirim"],
        ].map(([Icon, title, label], index) => (
          <div
            key={title as string}
            className="guide-demo-card flex items-center gap-3 rounded-xl bg-white/10 p-3"
            style={{ animationDelay: `${index * 130}ms` }}
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-violet-300/20 text-violet-100">
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-medium text-white">
                {title as string}
              </p>
              <p className="text-[9px] text-white/55">{label as string}</p>
            </div>
            {index === 2 && (
              <span className="guide-demo-pulse size-2 rounded-full bg-cyan-300" />
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function ExamsDemo() {
  return (
    <>
      <MiniHeader title="Deneme Analizi" icon={BarChart3} />
      <div className="p-3">
        <div className="rounded-xl bg-white/10 p-3">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-[9px] text-white/55">Son deneme</p>
              <p className="text-xl font-bold text-white">72,5 net</p>
            </div>
            <span className="rounded-full bg-emerald-300/20 px-2 py-1 text-[9px] text-emerald-100">
              +4,25
            </span>
          </div>
          <svg viewBox="0 0 240 80" className="h-20 w-full" aria-hidden="true">
            <defs>
              <linearGradient id="guide-chart" x1="0" y1="0" x2="1" y2="0">
                <stop stopColor="#67e8f9" />
                <stop offset="1" stopColor="#c4b5fd" />
              </linearGradient>
            </defs>
            <path
              d="M5 67 C35 62, 48 51, 73 54 S108 38, 132 42 S170 19, 195 28 S221 11, 235 12"
              fill="none"
              stroke="url(#guide-chart)"
              strokeWidth="5"
              strokeLinecap="round"
              className="guide-demo-chart"
            />
          </svg>
        </div>
      </div>
    </>
  );
}

function AccountDemo() {
  return (
    <>
      <MiniHeader title="Profil ve Destek" icon={ShieldCheck} />
      <div className="space-y-2 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 to-violet-300 font-bold text-slate-900">
            AY
          </span>
          <div>
            <p className="text-[11px] font-medium text-white">Ayşe Yılmaz</p>
            <p className="text-[9px] text-white/55">Hesap bilgileri</p>
          </div>
        </div>
        {["Kişisel Bilgiler", "Şifre Değiştir", "Sorun Bildir"].map((label, index) => (
          <div
            key={label}
            className="guide-demo-card flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CheckCircle2 className="size-4 text-cyan-200" />
            <span className="text-[10px] text-white/80">{label}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function DemoForKind({ kind }: { kind: GuideSceneKind }) {
  switch (kind) {
    case "dashboard":
      return <DashboardDemo />;
    case "children":
      return <DashboardDemo parent />;
    case "homework":
      return <HomeworkDemo />;
    case "resources":
      return <ResourcesDemo />;
    case "schedule":
      return <ScheduleDemo />;
    case "journal":
      return <ScheduleDemo journal />;
    case "updates":
      return <UpdatesDemo />;
    case "exams":
      return <ExamsDemo />;
    case "account":
      return <AccountDemo />;
  }
}

export function GuideScenePreview({ scene }: { scene: GuideScene }) {
  return (
    <div className="relative flex min-h-72 items-center justify-center overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 p-5 shadow-2xl shadow-primary/10 sm:min-h-96 sm:p-8">
      <div className="guide-demo-orb absolute -left-20 -top-20 size-56 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="guide-demo-orb absolute -bottom-24 -right-16 size-64 rounded-full bg-violet-500/25 blur-3xl [animation-delay:-4s]" />
      <div className="relative w-full max-w-sm overflow-hidden rounded-[1.75rem] border border-white/15 bg-white/5 pb-3 shadow-2xl backdrop-blur-xl">
        <div className="mx-auto mt-2 h-1.5 w-14 rounded-full bg-white/15" />
        <DemoForKind kind={scene.kind} />
      </div>
    </div>
  );
}
