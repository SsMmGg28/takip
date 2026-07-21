import type { Role } from "@/lib/types";
import {
  DASHBOARD_SECTION_IDS,
  type DashboardSectionId,
  type StoredLayout,
  type StoredLayoutV2,
} from "@/lib/dashboard-types";

export const DEFAULT_VISIBLE_SECTIONS = {
  student: ["today-flow", "homework-plan", "progress"],
  teacher: ["action-queue", "quick-create", "student-radar", "today-calendar"],
  parent: ["weekly-story", "upcoming", "academic-progress"],
} as const satisfies Record<Role, readonly DashboardSectionId[]>;

export function defaultDashboardLayout(role: Role): StoredLayoutV2 {
  return {
    version: 2,
    sections: DASHBOARD_SECTION_IDS[role].map((id) => ({
      id,
      collapsed: false,
    })),
    hidden: DASHBOARD_SECTION_IDS[role].filter(
      (id) => !DEFAULT_VISIBLE_SECTIONS[role].includes(id as never),
    ),
  };
}

export function normalizeDashboardLayout(
  role: Role,
  stored: StoredLayout | null,
  accessibleStudentIds: readonly string[] = [],
): StoredLayoutV2 {
  const fallback = defaultDashboardLayout(role);
  if (!stored || stored.version !== 2) return fallback;

  const candidate = stored as Partial<StoredLayoutV2>;
  const allowed = new Set<string>(DASHBOARD_SECTION_IDS[role]);
  const seen = new Set<string>();
  const sections = (Array.isArray(candidate.sections) ? candidate.sections : [])
    .filter(
      (section): section is StoredLayoutV2["sections"][number] =>
        Boolean(section) &&
        typeof section.id === "string" &&
        allowed.has(section.id) &&
        !seen.has(section.id) &&
        (seen.add(section.id), true),
    )
    .map((section) => ({ id: section.id, collapsed: section.collapsed === true }));

  for (const id of DASHBOARD_SECTION_IDS[role]) {
    if (!seen.has(id)) sections.push({ id, collapsed: false });
  }

  const hidden = Array.from(
    new Set(
      (Array.isArray(candidate.hidden) ? candidate.hidden : []).filter(
        (id): id is DashboardSectionId => typeof id === "string" && allowed.has(id),
      ),
    ),
  );

  const selectedStudentId =
    role === "parent" &&
    typeof candidate.selectedStudentId === "string" &&
    accessibleStudentIds.includes(candidate.selectedStudentId)
      ? candidate.selectedStudentId
      : undefined;

  return selectedStudentId
    ? { version: 2, sections, hidden, selectedStudentId }
    : { version: 2, sections, hidden };
}

export function assertDashboardLayout(role: Role, layout: StoredLayoutV2) {
  if (layout.version !== 2) throw new Error("Yerleşim sürümü geçersiz.");
  const allowed = new Set<string>(DASHBOARD_SECTION_IDS[role]);
  const ids = layout.sections.map((section) => section.id);
  if (
    ids.length !== new Set(ids).size ||
    ids.some((id) => !allowed.has(id)) ||
    layout.hidden.some((id) => !allowed.has(id))
  ) {
    throw new Error("Bu role ait olmayan bir bölüm kaydedilemez.");
  }
}
