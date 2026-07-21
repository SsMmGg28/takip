import { describe, expect, it } from "vitest";
import {
  assertDashboardLayout,
  defaultDashboardLayout,
  normalizeDashboardLayout,
} from "@/lib/dashboard-layout";
import type { StoredLayout, StoredLayoutV2 } from "@/lib/dashboard-types";

describe("dashboard layout v2", () => {
  it("sürüm 1 kaydını silmeden varsayılan v2 düzenine sıfırlar", () => {
    const legacy = { version: 1, items: [{ id: "stats", w: 4, h: 1 }] };
    expect(normalizeDashboardLayout("student", legacy as StoredLayout)).toEqual(
      defaultDashboardLayout("student"),
    );
  });

  it("sıra, gizleme ve daraltma durumunu korur", () => {
    const layout: StoredLayoutV2 = {
      version: 2,
      sections: [
        { id: "progress", collapsed: true },
        { id: "today-flow", collapsed: false },
      ],
      hidden: ["homework-plan"],
    };
    const normalized = normalizeDashboardLayout("student", layout);
    expect(normalized.sections.slice(0, 2)).toEqual(layout.sections);
    expect(normalized.hidden).toEqual(["homework-plan"]);
  });

  it("role ait olmayan bölümü reddeder", () => {
    const layout = {
      version: 2,
      sections: [{ id: "student-radar", collapsed: false }],
      hidden: [],
    } as StoredLayoutV2;
    expect(() => assertDashboardLayout("parent", layout)).toThrow("Bu role ait olmayan");
  });

  it("veli seçiminde yalnız erişilebilir çocuğu korur", () => {
    const layout: StoredLayoutV2 = {
      ...defaultDashboardLayout("parent"),
      selectedStudentId: "student-2",
    };
    expect(normalizeDashboardLayout("parent", layout, ["student-1"])).not.toHaveProperty(
      "selectedStudentId",
    );
    expect(normalizeDashboardLayout("parent", layout, ["student-2"])).toHaveProperty(
      "selectedStudentId",
      "student-2",
    );
  });
});
