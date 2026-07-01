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
    { href: "/teacher/students", label: "Öğrenciler", shortLabel: "Öğrenci", icon: Users },
    { href: "/teacher/homework", label: "Ödevler", shortLabel: "Ödev", icon: ClipboardList },
    { href: "/teacher/resources", label: "Kaynaklar", shortLabel: "Kaynak", icon: BookOpen },
    { href: "/teacher/book-requests", label: "İstekler", icon: Inbox },
    { href: "/teacher/calendar", label: "Takvim", icon: Calendar },
    { href: "/teacher/exams", label: "Deneme Analizi", shortLabel: "Deneme", icon: LineChart },
  ],
  student: [
    { href: "/student", label: "Panel", icon: LayoutDashboard },
    { href: "/student/homework", label: "Ödevlerim", shortLabel: "Ödev", icon: ClipboardList },
    { href: "/student/resources", label: "Kaynaklarım", shortLabel: "Kaynak", icon: BookOpen },
    { href: "/student/calendar", label: "Takvim", icon: Calendar },
    { href: "/student/schedule", label: "Çalışma Programım", shortLabel: "Program", icon: CalendarClock },
    { href: "/student/exams", label: "Deneme Analizim", shortLabel: "Deneme", icon: LineChart },
  ],
  parent: [
    { href: "/parent", label: "Panel", icon: LayoutDashboard },
    { href: "/parent/homework", label: "Ödevler", shortLabel: "Ödev", icon: ClipboardList },
    { href: "/parent/resources", label: "Kaynaklar", shortLabel: "Kaynak", icon: BookOpen },
    { href: "/parent/calendar", label: "Takvim", icon: Calendar },
    { href: "/parent/schedule", label: "Çalışma Programı", shortLabel: "Program", icon: CalendarClock },
    { href: "/parent/exams", label: "Deneme Analizi", shortLabel: "Deneme", icon: LineChart },
  ],
};

function isActive(pathname: string, href: string, roleRoot: string) {
  if (href === roleRoot) return pathname === roleRoot;
  return pathname === href || pathname.startsWith(href + "/");
}

export function DashboardNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const links = LINKS_BY_ROLE[role];
  const roleRoot = `/${role}`;

  return (
    <nav
      aria-label="Ana menü"
      className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {links.map((link) => {
        const active = isActive(pathname, link.href, roleRoot);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
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

export function MobileBottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const links = LINKS_BY_ROLE[role];
  const roleRoot = `/${role}`;

  return (
    <nav
      aria-label="Mobil menü"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div className="flex gap-0.5 overflow-x-auto px-1 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {links.map((link) => {
          const active = isActive(pathname, link.href, roleRoot);
          const Icon = link.icon;
          const label = link.shortLabel ?? link.label;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex min-w-[64px] shrink-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-2 py-1.5 text-[10px] font-medium leading-tight transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5" />
              <span className="whitespace-nowrap">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
