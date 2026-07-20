import type { ComponentType } from "react";
import dynamic from "next/dynamic";
import {
  BarChart3,
  Bell,
  BookMarked,
  BookOpen,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  Clock3,
  Flame,
  Hourglass,
  LineChart,
  Quote,
  StickyNote,
  Timer,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/types";
import type { LayoutItem, StoredLayout } from "@/lib/dashboard-types";
import { DEFAULT_WIDGET_IDS } from "@/lib/dashboard-layout";
import type { WidgetProps } from "@/components/dashboard/types";
import {
  BooksWidget,
  EventsWidget,
  ExamsWidget,
  HomeworkWidget,
  NotificationsWidget,
  PendingBooksWidget,
  PeopleWidget,
  StatsWidget,
  StreakWidget,
  WeeklyScheduleWidget,
  WeeklySummaryWidget,
} from "@/components/dashboard/widgets-data";
import { TodayScheduleWidget } from "@/components/dashboard/today-schedule-widget";

// Yerel/dekoratif araçlar varsayılan düzende değildir. Kullanıcı eklediğinde
// ilgili chunk yüklenir; böylece her rol ilk açılışta tüm araç kodunu ödemez.
const ClockWidget = dynamic<WidgetProps>(() =>
  import("@/components/dashboard/widgets-utility").then((m) => m.ClockWidget),
);
const CountdownWidget = dynamic<WidgetProps>(() =>
  import("@/components/dashboard/widgets-utility").then((m) => m.CountdownWidget),
);
const NotesWidget = dynamic<WidgetProps>(() =>
  import("@/components/dashboard/widgets-utility").then((m) => m.NotesWidget),
);
const PomodoroWidget = dynamic<WidgetProps>(() =>
  import("@/components/dashboard/widgets-utility").then((m) => m.PomodoroWidget),
);
const QuickLinksWidget = dynamic<WidgetProps>(() =>
  import("@/components/dashboard/widgets-utility").then((m) => m.QuickLinksWidget),
);
const QuoteWidget = dynamic<WidgetProps>(() =>
  import("@/components/dashboard/widgets-utility").then((m) => m.QuoteWidget),
);

export interface WidgetDef {
  id: string;
  title: string | ((role: Role) => string);
  description: string;
  icon: LucideIcon;
  roles: Role[];
  /** Verilirse widget başlığı ilgili sayfaya tıklanabilir link olur. */
  href?: (role: Role) => string | undefined;
  /** Varsayılan boyut ve izin verilen aralıklar (ızgara birimi). */
  defaultW: number;
  defaultH: number;
  minW: number;
  maxW: number;
  minH: number;
  maxH: number;
  component: ComponentType<WidgetProps>;
}

export const WIDGETS: WidgetDef[] = [
  {
    id: "stats",
    title: "Özet",
    description: "Bir bakışta güncel sayılar",
    icon: BarChart3,
    roles: ["teacher", "student", "parent"],
    defaultW: 4,
    defaultH: 1,
    minW: 2,
    maxW: 4,
    minH: 1,
    maxH: 2,
    component: StatsWidget,
  },
  {
    id: "homework",
    title: (role) => (role === "student" ? "Bekleyen Ödevlerim" : "Bekleyen Ödevler"),
    description: "Teslim tarihine göre sıralı ödev listesi",
    href: (role) => `/${role}/homework`,
    icon: ClipboardList,
    roles: ["teacher", "student", "parent"],
    defaultW: 2,
    defaultH: 2,
    minW: 1,
    maxW: 4,
    minH: 1,
    maxH: 3,
    component: HomeworkWidget,
  },
  {
    id: "today-schedule",
    title: "Bugünün Programı",
    description: "Çalışma programında bugüne ait saatler",
    href: (role) => `/${role}/schedule`,
    icon: CalendarDays,
    roles: ["student", "parent"],
    defaultW: 2,
    defaultH: 2,
    minW: 1,
    maxW: 4,
    minH: 1,
    maxH: 3,
    component: TodayScheduleWidget,
  },
  {
    id: "streak",
    title: "Çalışma Serisi",
    description: "Kaç gündür üst üste çalıştığını gösteren seri",
    href: () => "/student/gunluk",
    icon: Flame,
    roles: ["student"],
    defaultW: 2,
    defaultH: 1,
    minW: 1,
    maxW: 4,
    minH: 1,
    maxH: 2,
    component: StreakWidget,
  },
  {
    id: "weekly-schedule",
    title: "Haftalık Program",
    description: "Haftanın yoğunluğunu gösteren mini grafik",
    href: (role) => `/${role}/schedule`,
    icon: CalendarRange,
    roles: ["student", "parent"],
    defaultW: 2,
    defaultH: 2,
    minW: 2,
    maxW: 4,
    minH: 2,
    maxH: 3,
    component: WeeklyScheduleWidget,
  },
  {
    id: "events",
    title: "Yaklaşan Etkinlikler",
    description: "Takvimdeki dersler, hatırlatmalar ve teslimler",
    href: (role) => `/${role}/calendar`,
    icon: CalendarDays,
    roles: ["teacher", "student", "parent"],
    defaultW: 2,
    defaultH: 2,
    minW: 1,
    maxW: 4,
    minH: 1,
    maxH: 3,
    component: EventsWidget,
  },
  {
    id: "exams",
    title: "Son Denemeler",
    description: "Net gelişimini gösteren deneme özeti",
    href: (role) => `/${role}/exams`,
    icon: LineChart,
    roles: ["student", "parent"],
    defaultW: 2,
    defaultH: 2,
    minW: 2,
    maxW: 4,
    minH: 1,
    maxH: 3,
    component: ExamsWidget,
  },
  {
    id: "books",
    title: "Kitap İlerlemesi",
    description: "Kitaplıktaki kaynakların test ilerlemesi",
    href: (role) => `/${role}/resources`,
    icon: BookOpen,
    roles: ["student", "parent"],
    defaultW: 2,
    defaultH: 2,
    minW: 2,
    maxW: 4,
    minH: 1,
    maxH: 3,
    component: BooksWidget,
  },
  {
    id: "weekly-summary",
    title: "Haftalık Özet",
    description: "Çocuk başına bu haftanın ödev, test ve net dökümü",
    href: () => "/parent/homework",
    icon: BarChart3,
    roles: ["parent"],
    defaultW: 2,
    defaultH: 2,
    minW: 1,
    maxW: 4,
    minH: 1,
    maxH: 3,
    component: WeeklySummaryWidget,
  },
  {
    id: "notifications",
    title: "Son Bildirimler",
    description: "En yeni bildirimlerin listesi",
    icon: Bell,
    roles: ["teacher", "student", "parent"],
    defaultW: 2,
    defaultH: 2,
    minW: 1,
    maxW: 4,
    minH: 1,
    maxH: 3,
    component: NotificationsWidget,
  },
  {
    id: "book-approvals",
    title: "Onay Bekleyen Kitaplar",
    description: "Velilerin eklediği, onay bekleyen kaynaklar",
    href: () => "/teacher/resources",
    icon: BookMarked,
    roles: ["teacher"],
    defaultW: 2,
    defaultH: 2,
    minW: 1,
    maxW: 4,
    minH: 1,
    maxH: 3,
    component: PendingBooksWidget,
  },
  {
    id: "people",
    title: (role) => (role === "teacher" ? "Öğrencilerim" : "Çocuklarım"),
    description: "Takip edilen öğrencilerin listesi",
    href: (role) => (role === "teacher" ? "/teacher/students" : undefined),
    icon: Users,
    roles: ["teacher", "parent"],
    defaultW: 2,
    defaultH: 2,
    minW: 1,
    maxW: 4,
    minH: 1,
    maxH: 3,
    component: PeopleWidget,
  },
  {
    id: "clock",
    title: "Saat & Tarih",
    description: "Canlı saat ve bugünün tarihi",
    icon: Clock3,
    roles: ["teacher", "student", "parent"],
    defaultW: 1,
    defaultH: 1,
    minW: 1,
    maxW: 2,
    minH: 1,
    maxH: 2,
    component: ClockWidget,
  },
  {
    id: "pomodoro",
    title: "Pomodoro",
    description: "Odaklanma sayacı: çalış, mola ver, tekrarla",
    icon: Timer,
    roles: ["teacher", "student", "parent"],
    defaultW: 1,
    defaultH: 2,
    minW: 1,
    maxW: 2,
    minH: 1,
    maxH: 3,
    component: PomodoroWidget,
  },
  {
    id: "notes",
    title: "Hızlı Notlar",
    description: "Bu cihazda saklanan kişisel not alanı",
    icon: StickyNote,
    roles: ["teacher", "student", "parent"],
    defaultW: 1,
    defaultH: 2,
    minW: 1,
    maxW: 4,
    minH: 1,
    maxH: 3,
    component: NotesWidget,
  },
  {
    id: "countdown",
    title: "Geri Sayım",
    description: "Sınava/hedefe kalan gün sayısı",
    icon: Hourglass,
    roles: ["teacher", "student", "parent"],
    defaultW: 1,
    defaultH: 1,
    minW: 1,
    maxW: 2,
    minH: 1,
    maxH: 2,
    component: CountdownWidget,
  },
  {
    id: "quote",
    title: "Günün Sözü",
    description: "Her gün değişen motivasyon sözü",
    icon: Quote,
    roles: ["teacher", "student", "parent"],
    defaultW: 1,
    defaultH: 1,
    minW: 1,
    maxW: 2,
    minH: 1,
    maxH: 2,
    component: QuoteWidget,
  },
  {
    id: "quick-links",
    title: "Hızlı Erişim",
    description: "Sık kullanılan ekranlara kısayollar",
    icon: Zap,
    roles: ["teacher", "student", "parent"],
    defaultW: 1,
    defaultH: 2,
    minW: 1,
    maxW: 2,
    minH: 1,
    maxH: 3,
    component: QuickLinksWidget,
  },
];

export const WIDGET_BY_ID = new Map(WIDGETS.map((w) => [w.id, w]));

export function widgetTitle(def: WidgetDef, role: Role): string {
  return typeof def.title === "function" ? def.title(role) : def.title;
}

export function widgetsForRole(role: Role): WidgetDef[] {
  return WIDGETS.filter((w) => w.roles.includes(role));
}

/** Rol için varsayılan yerleşim: sırayla, varsayılan boyutlarla. */
export function defaultLayout(role: Role): LayoutItem[] {
  return DEFAULT_WIDGET_IDS[role]
    .map((id) => WIDGET_BY_ID.get(id))
    .filter((def): def is WidgetDef => Boolean(def && def.roles.includes(role)))
    .map((def) => ({ id: def.id, w: def.defaultW, h: def.defaultH }));
}

function clampSize(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** Kayıtlı yerleşimi hem sunucu görünümü hem istemci editörü için tek yerde doğrular. */
export function resolveLayout(
  stored: StoredLayout | null,
  role: Role,
): { items: LayoutItem[]; removed: string[] } {
  if (!stored) return { items: defaultLayout(role), removed: [] };

  const seen = new Set<string>();
  const items: LayoutItem[] = [];
  for (const item of stored.items ?? []) {
    const def = WIDGET_BY_ID.get(item.id);
    if (!def || !def.roles.includes(role) || seen.has(item.id)) continue;
    seen.add(item.id);
    items.push({
      id: item.id,
      w: clampSize(item.w || def.defaultW, def.minW, def.maxW),
      h: clampSize(item.h || def.defaultH, def.minH, def.maxH),
    });
  }

  const removed = (stored.removed ?? []).filter((id) => WIDGET_BY_ID.has(id));
  const known = new Set([...items.map((item) => item.id), ...removed]);
  const fresh = defaultLayout(role).filter((item) => !known.has(item.id));
  return { items: [...items, ...fresh], removed };
}
