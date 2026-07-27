"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import {
  BookOpen,
  Calendar,
  CalendarClock,
  ClipboardList,
  Flame,
  LayoutDashboard,
  LineChart,
  Megaphone,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/types";

export interface NavLinkDef {
  href: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
}

export const LINKS_BY_ROLE: Record<Role, NavLinkDef[]> = {
  teacher: [
    { href: "/teacher", label: "Anasayfa", icon: LayoutDashboard },
    { href: "/teacher/students", label: "Öğrenciler", icon: Users },
    { href: "/teacher/homework", label: "Ödevler", icon: ClipboardList },
    { href: "/teacher/resources", label: "Kütüphane", icon: BookOpen },
    { href: "/teacher/calendar", label: "Takvim", icon: Calendar },
    {
      href: "/teacher/exams",
      label: "Deneme Analizi",
      shortLabel: "Deneme",
      icon: LineChart,
    },
    {
      href: "/teacher/announcements",
      label: "Duyurular",
      shortLabel: "Duyuru",
      icon: Megaphone,
    },
    {
      href: "/teacher/profile",
      label: "Profilim",
      shortLabel: "Profil",
      icon: UserRound,
    },
  ],
  student: [
    { href: "/student", label: "Anasayfa", icon: LayoutDashboard },
    { href: "/student/homework", label: "Ödevlerim", icon: ClipboardList },
    { href: "/student/resources", label: "Kaynaklarım", icon: BookOpen },
    { href: "/student/calendar", label: "Takvim", icon: Calendar },
    {
      href: "/student/schedule",
      label: "Çalışma Programım",
      shortLabel: "Program",
      icon: CalendarClock,
    },
    {
      href: "/student/gunluk",
      label: "Çalışma Günlüğü",
      shortLabel: "Günlük",
      icon: Flame,
    },
    {
      href: "/student/exams",
      label: "Deneme Analizim",
      shortLabel: "Deneme",
      icon: LineChart,
    },
    {
      href: "/student/announcements",
      label: "Duyurular",
      shortLabel: "Duyuru",
      icon: Megaphone,
    },
    {
      href: "/student/profile",
      label: "Profilim",
      shortLabel: "Profil",
      icon: UserRound,
    },
  ],
  parent: [
    { href: "/parent", label: "Anasayfa", icon: LayoutDashboard },
    { href: "/parent/homework", label: "Ödevler", icon: ClipboardList },
    { href: "/parent/resources", label: "Kaynaklar", icon: BookOpen },
    { href: "/parent/calendar", label: "Takvim", icon: Calendar },
    {
      href: "/parent/schedule",
      label: "Çalışma Programı",
      shortLabel: "Program",
      icon: CalendarClock,
    },
    {
      href: "/parent/exams",
      label: "Deneme Analizi",
      shortLabel: "Deneme",
      icon: LineChart,
    },
    {
      href: "/parent/announcements",
      label: "Duyurular",
      shortLabel: "Duyuru",
      icon: Megaphone,
    },
    { href: "/parent/profile", label: "Profilim", shortLabel: "Profil", icon: UserRound },
  ],
};

/** "Deneme" linki; görünürlüğü sınıf düzeyi bağlamına bağlı tek menü öğesidir. */
export function isExamsLink(href: string) {
  return href.endsWith("/exams");
}

export function getLinks(role: Role, showExams: boolean) {
  return LINKS_BY_ROLE[role].filter((link) => showExams || !isExamsLink(link.href));
}

export function useActiveCheck(role: Role) {
  // usePathname, cacheComponents'ta dinamik paramlı rotalarda Suspense ister ve
  // nav'ı statik kabuktan düşürür; rol layout'u altındaki ilk segment ise her
  // rota için statik bilinir. Tüm nav linkleri `/rol/bölüm` biçiminde tek
  // segmentli olduğundan vurgu segmentten birebir türetilir.
  const segment = useSelectedLayoutSegment();
  const roleRoot = `/${role}`;
  return (href: string) =>
    href === roleRoot ? segment === null : href === `${roleRoot}/${segment}`;
}
