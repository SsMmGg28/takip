"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Coffee, Pause, Pencil, Play, RefreshCw, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { LINKS_BY_ROLE } from "@/components/dashboard-navigation-config";
import { useLocalStorageValue, useNow } from "@/components/dashboard/hooks";
import type { WidgetProps } from "@/components/dashboard/types";

// ─── Saat & Tarih ────────────────────────────────────────────────────────────

export function ClockWidget({ h }: WidgetProps) {
  const now = useNow(1000);

  if (!now) return <div className="animate-shimmer h-full rounded-xl" />;

  const time = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const date = now.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    weekday: "long",
  });

  return (
    <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
      <p className="text-4xl font-bold tabular-nums tracking-tight">
        {time}
        <span className="ml-1 align-baseline text-base font-medium text-muted-foreground">
          {seconds}
        </span>
      </p>
      <p className="text-xs text-muted-foreground">{date}</p>
      {h >= 2 && (
        <p className="mt-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          Yılın {Math.ceil((now.getMonth() + 1) / 3)}. çeyreği · {now.getFullYear()}
        </p>
      )}
    </div>
  );
}

// ─── Günün Sözü ──────────────────────────────────────────────────────────────

const QUOTES: { text: string; author: string }[] = [
  {
    text: "Başarı, her gün tekrarlanan küçük çabaların toplamıdır.",
    author: "R. Collier",
  },
  {
    text: "Bir şeyi gerçekten öğrenmek istiyorsan, onu başkasına anlat.",
    author: "R. Feynman",
  },
  { text: "Zor olan başlamaktır; gerisi kendiliğinden gelir.", author: "Sallust" },
  {
    text: "Eğitim, dünyayı değiştirmek için kullanabileceğin en güçlü silahtır.",
    author: "N. Mandela",
  },
  { text: "Şimdi yeni şeyler söylemek lazım.", author: "Mevlânâ" },
  { text: "Deha; yüzde bir ilham, yüzde doksan dokuz terdir.", author: "T. Edison" },
  {
    text: "Hata yapmayan insan, genellikle hiçbir şey yapmayan insandır.",
    author: "T. Roosevelt",
  },
  { text: "Bugün yapabileceklerini yarına bırakma.", author: "B. Franklin" },
  { text: "Küçük adımlar da ileri gidildiği sürece büyüktür.", author: "Anonim" },
  { text: "Disiplin, hedefler ile başarı arasındaki köprüdür.", author: "J. Rohn" },
  { text: "Öğrenmenin sonu yoktur; her gün yeni bir sayfadır.", author: "Anonim" },
  { text: "Vazgeçmediğin sürece kaybetmiş sayılmazsın.", author: "Anonim" },
  { text: "En büyük zafer, her düştüğünde ayağa kalkmaktır.", author: "Konfüçyüs" },
  { text: "Hayatta en hakiki mürşit ilimdir.", author: "M. K. Atatürk" },
  { text: "Ne kadar çok çalışırsam, o kadar şanslı oluyorum.", author: "T. Jefferson" },
  { text: "Bir hedefin yoksa, hiçbir rüzgâr işine yaramaz.", author: "Montaigne" },
];

function dayOfYear(d: Date) {
  return Math.floor(
    (d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86_400_000,
  );
}

export function QuoteWidget() {
  const now = useNow(60_000);
  const [offset, setOffset] = useState(0);

  if (!now) return <div className="animate-shimmer h-full rounded-xl" />;
  const quote = QUOTES[(dayOfYear(now) + offset) % QUOTES.length];

  return (
    <div className="flex h-full flex-col justify-center gap-2">
      <p className="text-sm font-medium italic leading-relaxed">“{quote.text}”</p>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">— {quote.author}</p>
        <button
          type="button"
          onClick={() => setOffset((o) => o + 1)}
          aria-label="Başka söz göster"
          className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground active:scale-90"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Pomodoro ────────────────────────────────────────────────────────────────

const WORK_OPTIONS = [25, 40, 50] as const;
const BREAK_MINUTES = 5;

interface PomodoroState {
  phase: "work" | "break";
  secondsLeft: number;
  cycles: number;
}

function tick(prev: PomodoroState, workMinutes: number): PomodoroState {
  if (prev.secondsLeft > 1) return { ...prev, secondsLeft: prev.secondsLeft - 1 };
  // Faz bitti: çalışma ↔ mola geçişi
  return prev.phase === "work"
    ? { phase: "break", secondsLeft: BREAK_MINUTES * 60, cycles: prev.cycles + 1 }
    : { phase: "work", secondsLeft: workMinutes * 60, cycles: prev.cycles };
}

export function PomodoroWidget({ h }: WidgetProps) {
  const [workMinutes, setWorkMinutes] = useState<number>(25);
  const [running, setRunning] = useState(false);
  const [state, setState] = useState<PomodoroState>({
    phase: "work",
    secondsLeft: 25 * 60,
    cycles: 0,
  });

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setState((prev) => tick(prev, workMinutes)), 1000);
    return () => clearInterval(t);
  }, [running, workMinutes]);

  function reset(minutes = workMinutes) {
    setRunning(false);
    setState((prev) => ({
      phase: "work",
      secondsLeft: minutes * 60,
      cycles: prev.cycles,
    }));
  }

  const total = (state.phase === "work" ? workMinutes : BREAK_MINUTES) * 60;
  const mins = Math.floor(state.secondsLeft / 60);
  const secs = state.secondsLeft % 60;
  const progress = 1 - state.secondsLeft / total;
  const R = 34;
  const C = 2 * Math.PI * R;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2">
      <div className="relative flex items-center justify-center">
        <svg width="92" height="92" viewBox="0 0 92 92" className="-rotate-90">
          <circle
            cx="46"
            cy="46"
            r={R}
            fill="none"
            strokeWidth="6"
            className="stroke-muted"
          />
          <circle
            cx="46"
            cy="46"
            r={R}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - progress)}
            className={cn(
              "transition-[stroke-dashoffset] duration-1000 ease-linear",
              state.phase === "work" ? "stroke-primary" : "stroke-success",
            )}
          />
        </svg>
        <div className="absolute text-center">
          <p className="text-xl font-bold tabular-nums">
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </p>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {state.phase === "work" ? "Odaklan" : "Mola"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          aria-label={running ? "Duraklat" : "Başlat"}
          className="gradient-surface flex h-11 w-11 items-center justify-center rounded-full text-white shadow-md shadow-primary/25 active:scale-90"
        >
          {running ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => reset()}
          aria-label="Sıfırla"
          className="flex h-11 w-11 items-center justify-center rounded-full border text-muted-foreground hover:bg-accent hover:text-accent-foreground active:scale-90"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {h >= 2 && (
        <>
          <div className="flex gap-1">
            {WORK_OPTIONS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setWorkMinutes(m);
                  reset(m);
                }}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium",
                  workMinutes === m
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-accent",
                )}
              >
                {m} dk
              </button>
            ))}
          </div>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Coffee className="h-3 w-3" /> {state.cycles} tur tamamlandı
          </p>
        </>
      )}
    </div>
  );
}

// ─── Hızlı Notlar ────────────────────────────────────────────────────────────

export function NotesWidget({ data }: WidgetProps) {
  const [value, setValue, hydrated] = useLocalStorageValue(
    `dashboard-notes:${data.role}`,
  );

  if (!hydrated) return <div className="animate-shimmer h-full rounded-xl" />;

  return (
    <div className="flex h-full flex-col gap-1.5">
      <textarea
        value={value ?? ""}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Aklındakileri buraya yaz…"
        className="min-h-0 w-full flex-1 resize-none rounded-xl border bg-muted/30 p-3 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/70 focus:border-ring"
      />
      <p className="self-end text-xs text-muted-foreground/70">Bu cihazda saklanır</p>
    </div>
  );
}

// ─── Geri Sayım ──────────────────────────────────────────────────────────────

interface CountdownConfig {
  label: string;
  date: string; // "YYYY-MM-DD"
}

export function CountdownWidget({ data }: WidgetProps) {
  const [raw, setRaw, hydrated] = useLocalStorageValue(
    `dashboard-countdown:${data.role}`,
  );
  const now = useNow(60_000);
  const [editing, setEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState("");
  const [draftDate, setDraftDate] = useState("");

  const config = useMemo<CountdownConfig | null>(() => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as CountdownConfig;
      return parsed?.date ? parsed : null;
    } catch {
      return null;
    }
  }, [raw]);

  if (!hydrated || !now) return <div className="animate-shimmer h-full rounded-xl" />;

  function save() {
    if (!draftDate) return;
    setRaw(JSON.stringify({ label: draftLabel.trim() || "Hedef", date: draftDate }));
    setEditing(false);
  }

  if (!config || editing) {
    return (
      <div className="flex h-full flex-col justify-center gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          Hedefini belirle (ör. LGS, yazılı sınavı):
        </p>
        <input
          value={draftLabel}
          onChange={(e) => setDraftLabel(e.target.value)}
          placeholder="Hedef adı"
          className="h-9 rounded-xl border bg-muted/30 px-3 text-sm outline-none focus:border-ring"
        />
        <input
          type="date"
          value={draftDate}
          onChange={(e) => setDraftDate(e.target.value)}
          className="h-9 rounded-xl border bg-muted/30 px-3 text-sm outline-none focus:border-ring"
        />
        <button
          type="button"
          onClick={save}
          disabled={!draftDate}
          className="gradient-surface h-9 rounded-xl text-sm font-semibold text-white shadow-sm disabled:opacity-50"
        >
          Kaydet
        </button>
      </div>
    );
  }

  const target = new Date(config.date + "T00:00:00");
  const diffMs = target.getTime() - now.getTime();
  const days = Math.ceil(diffMs / 86_400_000);
  const passed = diffMs < 0;

  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-1 text-center">
      <button
        type="button"
        onClick={() => {
          setDraftLabel(config.label);
          setDraftDate(config.date);
          setEditing(true);
        }}
        aria-label="Geri sayımı düzenle"
        className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {config.label}
      </p>
      {passed ? (
        <p className="text-2xl font-bold">Tarih geçti 🎉</p>
      ) : (
        <p className="text-4xl font-bold tabular-nums tracking-tight">
          {days}
          <span className="ml-1 text-base font-medium text-muted-foreground">gün</span>
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        {target.toLocaleDateString("tr-TR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>
    </div>
  );
}

// ─── Hızlı Erişim ────────────────────────────────────────────────────────────

export function QuickLinksWidget({ data, w }: WidgetProps) {
  const links = LINKS_BY_ROLE[data.role].filter((l) => l.href !== `/${data.role}`);

  return (
    <div
      className={cn(
        "grid h-full content-center gap-1.5",
        w >= 2 ? "grid-cols-2" : "grid-cols-1",
      )}
    >
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-2 rounded-xl border bg-muted/30 px-2.5 py-2 text-xs font-medium hover:bg-accent hover:text-accent-foreground active:scale-95"
          >
            <span className="gradient-surface flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-white">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="truncate">{link.shortLabel ?? link.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
