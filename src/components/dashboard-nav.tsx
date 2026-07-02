"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  BookOpen,
  Calendar,
  CalendarClock,
  LineChart,
  Inbox,
  Menu,
  X,
  Pin,
  PinOff,
  Check,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Role = "teacher" | "student" | "parent";

interface NavLinkDef {
  href: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
}

const LINKS_BY_ROLE: Record<Role, NavLinkDef[]> = {
  teacher: [
    { href: "/teacher", label: "Panel", icon: LayoutDashboard },
    { href: "/teacher/students", label: "Öğrenciler", icon: Users },
    { href: "/teacher/homework", label: "Ödevler", icon: ClipboardList },
    { href: "/teacher/resources", label: "Kaynaklar", icon: BookOpen },
    { href: "/teacher/book-requests", label: "İstekler", icon: Inbox },
    { href: "/teacher/calendar", label: "Takvim", icon: Calendar },
    { href: "/teacher/exams", label: "Deneme Analizi", shortLabel: "Deneme", icon: LineChart },
  ],
  student: [
    { href: "/student", label: "Panel", icon: LayoutDashboard },
    { href: "/student/homework", label: "Ödevlerim", icon: ClipboardList },
    { href: "/student/resources", label: "Kaynaklarım", icon: BookOpen },
    { href: "/student/calendar", label: "Takvim", icon: Calendar },
    { href: "/student/schedule", label: "Çalışma Programım", shortLabel: "Program", icon: CalendarClock },
    { href: "/student/exams", label: "Deneme Analizim", shortLabel: "Deneme", icon: LineChart },
  ],
  parent: [
    { href: "/parent", label: "Panel", icon: LayoutDashboard },
    { href: "/parent/homework", label: "Ödevler", icon: ClipboardList },
    { href: "/parent/resources", label: "Kaynaklar", icon: BookOpen },
    { href: "/parent/calendar", label: "Takvim", icon: Calendar },
    { href: "/parent/schedule", label: "Çalışma Programı", shortLabel: "Program", icon: CalendarClock },
    { href: "/parent/exams", label: "Deneme Analizi", shortLabel: "Deneme", icon: LineChart },
  ],
};

const MAX_PINNED = 4;

function getLinks(role: Role, showExams: boolean) {
  return LINKS_BY_ROLE[role].filter(
    (link) => showExams || !link.href.endsWith("/exams"),
  );
}

function useActiveCheck(role: Role) {
  const pathname = usePathname();
  const roleRoot = `/${role}`;
  return (href: string) =>
    href === roleRoot
      ? pathname === roleRoot
      : pathname === href || pathname.startsWith(href + "/");
}

/** Masaüstü: header içinde hap (pill) navigasyon. Mobilde gizli. */
export function DashboardNav({
  role,
  showExams = true,
}: {
  role: Role;
  showExams?: boolean;
}) {
  const isActive = useActiveCheck(role);
  const links = getLinks(role, showExams);

  return (
    <nav className="hidden items-center gap-1 rounded-full border bg-card/60 p-1 shadow-sm sm:flex">
      {links.map((link) => {
        const active = isActive(link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap",
              active
                ? "gradient-surface text-white shadow-md shadow-primary/30 scale-[1.03]"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-[1.03] active:scale-95",
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// ─── Mobil: sabit butonlar + menü adası ──────────────────────────────────────

// Sabitlenen butonlar cihaz bazında localStorage'da tutulur.
function pinsKey(role: Role) {
  return `mobile-nav-pins:${role}`;
}

const PINS_EVENT = "mobile-nav-pins-changed";

function subscribePins(callback: () => void) {
  window.addEventListener(PINS_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(PINS_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function usePinnedHrefs(role: Role, links: NavLinkDef[]): [string[], (next: string[]) => void] {
  const raw = useSyncExternalStore(
    subscribePins,
    () => window.localStorage.getItem(pinsKey(role)) ?? "",
    () => "",
  );

  let pinned: string[] = [];
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed)) {
      pinned = parsed.filter(
        (href): href is string =>
          typeof href === "string" && links.some((l) => l.href === href),
      );
    }
  } catch {
    pinned = [];
  }
  if (pinned.length === 0) {
    pinned = links.slice(0, MAX_PINNED).map((l) => l.href);
  }
  pinned = pinned.slice(0, MAX_PINNED);

  const setPinned = useCallback(
    (next: string[]) => {
      window.localStorage.setItem(pinsKey(role), JSON.stringify(next.slice(0, MAX_PINNED)));
      window.dispatchEvent(new Event(PINS_EVENT));
    },
    [role],
  );

  return [pinned, setPinned];
}

/**
 * Mobil navigasyon: altta 4 özelleştirilebilir sabit buton + ortada menü
 * butonu. Menüye basınca sabit olmayan ekranların butonlarını gösteren yüzen
 * bir ada animasyonla açılır. sm ve üzeri ekranlarda gizli.
 */
export function MobileNav({
  role,
  showExams = true,
}: {
  role: Role;
  showExams?: boolean;
}) {
  const isActive = useActiveCheck(role);
  const links = getLinks(role, showExams);
  const [pinned, setPinned] = usePinnedHrefs(role, links);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const pinnedLinks = pinned
    .map((href) => links.find((l) => l.href === href))
    .filter((l): l is NavLinkDef => Boolean(l));
  const islandLinks = links.filter((l) => !pinned.includes(l.href));

  function closeIsland() {
    setOpen(false);
    setEditing(false);
  }

  function unpin(href: string) {
    if (pinned.length <= 1) {
      toast.error("En az bir sabit buton kalmalı.");
      return;
    }
    setPinned(pinned.filter((p) => p !== href));
  }

  function pin(href: string) {
    if (pinned.length >= MAX_PINNED) {
      toast.error(`En fazla ${MAX_PINNED} sabit buton seçebilirsin. Önce birini çıkar.`);
      return;
    }
    setPinned([...pinned, href]);
  }

  // Sabit butonları menünün iki yanına dağıt (2 sol + 2 sağ).
  const half = Math.ceil(pinnedLinks.length / 2);
  const leftLinks = pinnedLinks.slice(0, half);
  const rightLinks = pinnedLinks.slice(half);

  function renderBarItem(link: NavLinkDef) {
    const active = isActive(link.href);
    const Icon = link.icon;
    return (
      <div key={link.href} className="relative flex min-w-0 flex-1 justify-center">
        {editing ? (
          <button
            type="button"
            onClick={() => unpin(link.href)}
            className="flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium text-muted-foreground"
            aria-label={`${link.label} sabitten çıkar`}
          >
            <span className="relative flex h-8 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Icon className="h-[18px] w-[18px]" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-white">
                <PinOff className="h-2.5 w-2.5" />
              </span>
            </span>
            <span className="max-w-full truncate">{link.shortLabel ?? link.label}</span>
          </button>
        ) : (
          <Link
            href={link.href}
            onClick={closeIsland}
            className={cn(
              "flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium",
              active ? "text-primary" : "text-muted-foreground active:scale-90",
            )}
          >
            <span
              className={cn(
                "flex h-8 w-12 items-center justify-center rounded-full transition-all duration-300",
                active && "gradient-surface text-white shadow-md shadow-primary/30",
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <span className="max-w-full truncate">{link.shortLabel ?? link.label}</span>
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Ada açıkken arka planı kapatan katman */}
      {open && (
        <button
          type="button"
          aria-label="Menüyü kapat"
          onClick={closeIsland}
          className="animate-fade-in fixed inset-0 z-30 bg-black/25 backdrop-blur-[2px] sm:hidden"
        />
      )}

      {/* Yüzen ada */}
      {open && (
        <div className="fixed inset-x-4 bottom-24 z-40 sm:hidden">
          <div className="animate-scale-in glass origin-bottom rounded-3xl border p-4 shadow-2xl shadow-primary/15">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {editing ? "Sabit butonları düzenle" : "Diğer ekranlar"}
              </p>
              <button
                type="button"
                onClick={() => setEditing((e) => !e)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  editing
                    ? "gradient-surface text-white shadow-sm"
                    : "bg-secondary text-secondary-foreground",
                )}
              >
                {editing ? <Check className="h-3.5 w-3.5" /> : <Settings2 className="h-3.5 w-3.5" />}
                {editing ? "Bitti" : "Özelleştir"}
              </button>
            </div>

            {editing && (
              <p className="mb-3 text-xs text-muted-foreground">
                Alt bardaki butona dokunarak çıkar, buradakine dokunarak sabitle
                (en fazla {MAX_PINNED}).
              </p>
            )}

            {islandLinks.length === 0 && !editing ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Tüm ekranlar alt barda sabitli.
              </p>
            ) : (
              <div className="stagger grid grid-cols-3 gap-2">
                {islandLinks.map((link) => {
                  const active = isActive(link.href);
                  const Icon = link.icon;
                  if (editing) {
                    return (
                      <button
                        key={link.href}
                        type="button"
                        onClick={() => pin(link.href)}
                        className="flex flex-col items-center gap-1.5 rounded-2xl border border-dashed bg-muted/40 px-2 py-3 text-center"
                        aria-label={`${link.label} bara sabitle`}
                      >
                        <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
                          <Icon className="h-5 w-5" />
                          <span className="gradient-surface absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-white">
                            <Pin className="h-2.5 w-2.5" />
                          </span>
                        </span>
                        <span className="text-[11px] font-medium leading-tight">
                          {link.shortLabel ?? link.label}
                        </span>
                      </button>
                    );
                  }
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeIsland}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 text-center transition-colors active:scale-95",
                        active ? "bg-accent" : "hover:bg-accent/60",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full",
                          active
                            ? "gradient-surface text-white shadow-md shadow-primary/30"
                            : "bg-secondary text-secondary-foreground",
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-[11px] font-medium leading-tight">
                        {link.shortLabel ?? link.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alt bar */}
      <nav className="glass animate-rise fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] sm:hidden">
        <div className="flex items-stretch justify-around gap-0.5 px-1 py-1.5">
          {leftLinks.map(renderBarItem)}

          {/* Menü butonu */}
          <div className="flex flex-1 justify-center">
            <button
              type="button"
              onClick={() => (open ? closeIsland() : setOpen(true))}
              aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
              aria-expanded={open}
              className="flex flex-col items-center gap-0.5 px-1 py-1.5 text-[10px] font-medium text-muted-foreground"
            >
              <span
                className={cn(
                  "gradient-surface flex h-9 w-9 items-center justify-center rounded-full text-white shadow-lg shadow-primary/35 transition-transform duration-300 active:scale-90",
                  open && "rotate-90 scale-105",
                )}
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </span>
              <span>Menü</span>
            </button>
          </div>

          {rightLinks.map(renderBarItem)}
        </div>
      </nav>
    </>
  );
}
