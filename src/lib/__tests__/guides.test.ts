import { describe, expect, it } from "vitest";
import {
  getGuideById,
  getGuidesForContext,
  getHighestPriorityAutoGuide,
  guideNeedsAttention,
} from "@/lib/guides";

describe("rehber seçimi", () => {
  it("öğrenci ve veli tanımlarını role göre ayırır", () => {
    const student = getGuidesForContext({ role: "student", examsEnabled: true });
    const parent = getGuidesForContext({ role: "parent", examsEnabled: true });
    expect(student.length).toBeGreaterThan(1);
    expect(parent.length).toBeGreaterThan(1);
    expect(student.every((guide) => guide.roles.includes("student"))).toBe(true);
    expect(parent.every((guide) => guide.roles.includes("parent"))).toBe(true);
    expect(getGuidesForContext({ role: "teacher", examsEnabled: true })).toEqual([]);
  });

  it("deneme rehberini yalnız uygun sınıf bağlamında gösterir", () => {
    const disabled = getGuidesForContext({ role: "student", examsEnabled: false });
    const enabled = getGuidesForContext({ role: "student", examsEnabled: true });
    expect(disabled.some((guide) => guide.id === "student-exams")).toBe(false);
    expect(enabled.some((guide) => guide.id === "student-exams")).toBe(true);
  });

  it("kaydı olmayan veya sürümü eski rehberi yeni kabul eder", () => {
    const guide = getGuideById("student-quick-start")!;
    expect(guideNeedsAttention(guide, [])).toBe(true);
    expect(
      guideNeedsAttention(guide, [
        { guideId: guide.id, version: guide.version - 1, outcome: "completed" },
      ]),
    ).toBe(true);
    expect(
      guideNeedsAttention(guide, [
        { guideId: guide.id, version: guide.version, outcome: "skipped" },
      ]),
    ).toBe(false);
  });

  it("oturumda yalnız en yüksek öncelikli yeni otomatik rehberi seçer", () => {
    const guides = getGuidesForContext({ role: "parent", examsEnabled: true });
    const quickStart = getGuideById("parent-quick-start")!;
    expect(getHighestPriorityAutoGuide(guides, [])?.id).toBe("parent-quick-start");
    expect(
      getHighestPriorityAutoGuide(guides, [
        { guideId: "parent-quick-start", version: 1, outcome: "completed" },
      ]),
    )?.toMatchObject({ id: quickStart.id, version: quickStart.version });
    expect(
      getHighestPriorityAutoGuide(guides, [
        {
          guideId: "parent-quick-start",
          version: quickStart.version,
          outcome: "skipped",
        },
      ]),
    ).toBeUndefined();
  });

  it("hatalı kapanıştan etkilenmiş hızlı başlangıç v1 kayıtlarını yeniden açar", () => {
    for (const guideId of ["student-quick-start", "parent-quick-start"]) {
      const guide = getGuideById(guideId)!;
      expect(guide.version).toBe(2);
      expect(
        guideNeedsAttention(guide, [{ guideId, version: 1, outcome: "skipped" }]),
      ).toBe(true);
    }
  });

  it("tüm gerçek ekran turlarında rolün kendi rotasını kullanır", () => {
    for (const role of ["student", "parent"] as const) {
      const guides = getGuidesForContext({ role, examsEnabled: true });
      for (const step of guides.flatMap((guide) => guide.tour)) {
        expect(step.route.startsWith(`/${role}`)).toBe(true);
        expect(step.anchor.length).toBeGreaterThan(0);
      }
    }
  });
});
