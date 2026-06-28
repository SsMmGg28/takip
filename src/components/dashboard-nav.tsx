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
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "teacher" | "student" | "parent";

interface NavLinkDef {
  href: string;
  label: string;
  icon: LucideIcon;
}

const LINKS_BY_ROLE: Record<Role, NavLinkDef[]> = {
  teacher: [
    { href: "/teacher", label: "Panel", icon: LayoutDashboard },
    { href: "/teacher/students", label: "Öğrenciler", icon: Users },
    { href: "/teacher/homework", label: "Ödevler", icon: ClipboardList },
    { href: "/teacher/resources", label: "Kaynaklar", icon: BookOpen },
    { href: "/teacher/calendar", label: "Takvim", icon: Calendar },
    { href: "/teacher/exams", label: "Deneme Analizi", icon: LineChart },
  ],
  student: [
    { href: "/student", label: "Panel", icon: LayoutDashboard },
    { href: "/student/homework", label: "Ödevlerim", icon: ClipboardList },
    { href: "/student/resources", label: "Kaynaklarım", icon: BookOpen },
    { href: "/student/calendar", label: "Takvim", icon: Calendar },
    { href: "/student/schedule", label: "Çalışma Programım", icon: CalendarClock },
    { href: "/student/exams", label: "Deneme Analizim", icon: LineChart },
  ],
  parent: [
    { href: "/parent", label: "Panel", icon: LayoutDashboard },
    { href: "/parent/homework", label: "Ödevler", icon: ClipboardList },
    { href: "/parent/resources", label: "Kaynaklar", icon: BookOpen },
    { href: "/parent/calendar", label: "Takvim", icon: Calendar },
    { href: "/parent/schedule", label: "Çalışma Programı", icon: CalendarClock },
    { href: "/parent/exams", label: "Deneme Analizi", icon: LineChart },
  ],
};

export function DashboardNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const links = LINKS_BY_ROLE[role];
  const roleRoot = `/${role}`;

  return (
    <nav className="flex flex-wrap gap-1">
      {links.map((link) => {
        const active =
          link.href === roleRoot
            ? pathname === roleRoot
            : pathname === link.href || pathname.startsWith(link.href + "/");
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
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
