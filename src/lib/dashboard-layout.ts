import type { Role } from "@/lib/types";
import type { StoredLayout } from "@/lib/dashboard-types";

/**
 * Widget kimlikleri sunucu veri katmanı ile istemci registry'si arasında ortak
 * sözleşmedir. Dekoratif/yerel araçlar kullanılabilir kalır, fakat ilk açılışta
 * veri ve JavaScript bütçesini tüketmemeleri için varsayılan düzende yer almaz.
 */
export const WIDGET_IDS_BY_ROLE = {
  student: [
    "stats",
    "streak",
    "homework",
    "today-schedule",
    "weekly-schedule",
    "events",
    "exams",
    "books",
    "notifications",
    "clock",
    "pomodoro",
    "notes",
    "countdown",
    "quote",
    "quick-links",
  ],
  teacher: [
    "stats",
    "homework",
    "events",
    "notifications",
    "book-approvals",
    "people",
    "clock",
    "pomodoro",
    "notes",
    "countdown",
    "quote",
    "quick-links",
  ],
  parent: [
    "stats",
    "homework",
    "today-schedule",
    "weekly-schedule",
    "events",
    "exams",
    "books",
    "weekly-summary",
    "notifications",
    "people",
    "clock",
    "pomodoro",
    "notes",
    "countdown",
    "quote",
    "quick-links",
  ],
} as const satisfies Record<Role, readonly string[]>;

export const DEFAULT_WIDGET_IDS = {
  student: ["stats", "streak", "homework", "today-schedule", "events", "exams", "books"],
  teacher: ["stats", "homework", "book-approvals", "events", "people", "notifications"],
  parent: ["stats", "weekly-summary", "homework", "people", "events", "exams", "books"],
} as const satisfies Record<Role, readonly string[]>;

export type DashboardWidgetId = (typeof WIDGET_IDS_BY_ROLE)[Role][number];

/** Kayıtlı düzeni, istemci reconcile davranışıyla aynı biçimde görünür kimliklere çevirir. */
export function visibleWidgetIds(
  role: Role,
  stored: StoredLayout | null,
): Set<DashboardWidgetId> {
  const allowed = new Set<string>(WIDGET_IDS_BY_ROLE[role]);
  if (!stored) return new Set(DEFAULT_WIDGET_IDS[role]);

  const removed = new Set((stored.removed ?? []).filter((id) => allowed.has(id)));
  const visible = new Set<DashboardWidgetId>();
  for (const item of stored.items ?? []) {
    if (allowed.has(item.id)) visible.add(item.id as DashboardWidgetId);
  }
  for (const id of DEFAULT_WIDGET_IDS[role]) {
    if (!visible.has(id) && !removed.has(id)) visible.add(id);
  }
  return visible;
}
