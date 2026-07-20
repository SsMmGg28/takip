import { describe, expect, it } from "vitest";
import { DEFAULT_WIDGET_IDS, visibleWidgetIds } from "@/lib/dashboard-layout";
import type { StoredLayout } from "@/lib/dashboard-types";

describe("visibleWidgetIds", () => {
  it("returns the lightweight role defaults without a saved layout", () => {
    expect([...visibleWidgetIds("student", null)]).toEqual([
      ...DEFAULT_WIDGET_IDS.student,
    ]);
    expect(visibleWidgetIds("teacher", null).has("clock")).toBe(false);
  });

  it("keeps valid saved widgets and respects explicit removals", () => {
    const stored: StoredLayout = {
      version: 1,
      items: [
        { id: "stats", w: 4, h: 1 },
        { id: "notes", w: 2, h: 2 },
      ],
      removed: ["homework", "events"],
    };

    const visible = visibleWidgetIds("student", stored);
    expect(visible.has("stats")).toBe(true);
    expect(visible.has("notes")).toBe(true);
    expect(visible.has("homework")).toBe(false);
    expect(visible.has("events")).toBe(false);
    expect(visible.has("books")).toBe(true);
  });

  it("drops widget ids that are not available to the role", () => {
    const stored: StoredLayout = {
      version: 1,
      items: [
        { id: "book-approvals", w: 2, h: 2 },
        { id: "stats", w: 4, h: 1 },
      ],
      removed: [],
    };

    expect(visibleWidgetIds("parent", stored).has("book-approvals")).toBe(false);
  });
});
