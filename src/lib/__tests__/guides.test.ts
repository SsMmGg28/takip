import { describe, expect, it } from "vitest";
import {
  GUIDE_DEFINITIONS,
  findPendingAutomaticGuide,
  getGuidesForRole,
  routeForGuide,
  type GuideDefinition,
} from "@/lib/guides";

describe("guide definitions", () => {
  it("rehber kimlikleri benzersiz ve sürümleri geçerlidir", () => {
    const ids = GUIDE_DEFINITIONS.map((guide) => guide.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(GUIDE_DEFINITIONS.every((guide) => guide.version > 0)).toBe(true);
    expect(GUIDE_DEFINITIONS.every((guide) => guide.scenes.length > 0)).toBe(true);
  });

  it("öğrenci ve veli kataloglarını role göre ayırır", () => {
    const student = getGuidesForRole("student", { exams: true });
    const parent = getGuidesForRole("parent", { exams: true });

    expect(student.some((guide) => guide.id === "student-quick-start")).toBe(true);
    expect(student.some((guide) => guide.id === "parent-quick-start")).toBe(false);
    expect(parent.some((guide) => guide.id === "parent-quick-start")).toBe(true);
    expect(parent.some((guide) => guide.id === "student-quick-start")).toBe(false);
  });

  it("deneme rehberini sınıf yeteneğine göre filtreler", () => {
    expect(
      getGuidesForRole("student", { exams: false }).some(
        (guide) => guide.id === "student-exams",
      ),
    ).toBe(false);
    expect(
      getGuidesForRole("student", { exams: true }).some(
        (guide) => guide.id === "student-exams",
      ),
    ).toBe(true);
  });

  it("kayıt yoksa hızlı başlangıcı bekleyen rehber olarak seçer", () => {
    const guides = getGuidesForRole("student", { exams: true });
    expect(findPendingAutomaticGuide(guides, [])?.id).toBe("student-quick-start");
  });

  it("aynı sürüm görüldüyse otomatik açmaz, eski sürümde yeniden açar", () => {
    const guides = getGuidesForRole("parent", { exams: true });
    expect(
      findPendingAutomaticGuide(guides, [
        { guide_id: "parent-quick-start", version: 1, outcome: "skipped" },
      ]),
    ).toBeNull();
    expect(
      findPendingAutomaticGuide(guides, [
        { guide_id: "parent-quick-start", version: 0, outcome: "completed" },
      ])?.id,
    ).toBe("parent-quick-start");
  });

  it("birden fazla yeni sürümde en yüksek öncelikli rehberi seçer", () => {
    const base = getGuidesForRole("student", { exams: true })[0];
    const low: GuideDefinition = {
      ...base,
      id: "lower-priority",
      priority: 10,
      autoLaunch: true,
    };
    expect(findPendingAutomaticGuide([base, low], [])?.id).toBe(base.id);
  });

  it("tur adımının rota geçersiz kılmasını kullanır", () => {
    const guide = GUIDE_DEFINITIONS.find((item) => item.id === "student-planning")!;
    expect(routeForGuide(guide, "student", guide.tourSteps[2])).toBe("/student/gunluk");
  });
});
