"use client";

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
  type LucideIcon,
} from "lucide-react";
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

function useActiveCheck(role: Role) {
  const pathname = usePathname();
  const roleRoot = `/${role}`;
  return (href: string) =>
    href === roleRoot
      ? pathname === roleRoot
      : pathname === href || pathname.startsWith(href + "/");
}

/** Masaüstü: header içinde hap (pill) navigasyon. Mobilde gizli. */
export function DashboardNav({ role }: { role: Role }) {
  const isActive = useActiveCheck(role);
  const links = LINKS_BY_ROLE[role];

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

/** Mobil: ekranın altına sabitlenmiş cam navigasyon çubuğu. sm ve üzeri ekranlarda gizli. */
export function MobileNav({ role }: { role: Role }) {
  const isActive = useActiveCheck(role);
  const links = LINKS_BY_ROLE[role];

  return (
    <nav className="glass animate-rise fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] sm:hidden">
      <div className="flex items-stretch justify-around gap-0.5 px-1 py-1.5">
        {links.map((link) => {
          const active = isActive(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium",
                active
                  ? "text-primary"
                  : "text-muted-foreground active:scale-90",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-12 items-center justify-center rounded-full transition-all duration-300",
                  active
                    ? "gradient-surface text-white shadow-md shadow-primary/30"
                    : "",
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className="max-w-full truncate">
                {link.shortLabel ?? link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
