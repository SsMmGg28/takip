import { describe, it, expect } from "vitest";
import {
  isBookGrade,
  getBookSubjects,
  getBookUnits,
  bookUnitName,
} from "@/lib/book-catalog";

describe("isBookGrade", () => {
  it("5-8 arası true, dışı false", () => {
    for (const g of [5, 6, 7, 8]) expect(isBookGrade(g)).toBe(true);
    for (const g of [4, 9, null, undefined]) expect(isBookGrade(g)).toBe(false);
  });
});

describe("getBookSubjects", () => {
  it("8. sınıf derslerini döner (İnkılap dahil)", () => {
    const subs = getBookSubjects(8);
    expect(subs).toContain("Matematik");
    expect(subs).toContain("T.C. İnkılap Tarihi");
  });
  it("7. sınıfta İnkılap yuvası Sosyal Bilgiler'dir", () => {
    const subs = getBookSubjects(7);
    expect(subs).toContain("Sosyal Bilgiler");
    expect(subs).not.toContain("T.C. İnkılap Tarihi");
  });
  it("geçersiz sınıfta boş dizi", () => {
    expect(getBookSubjects(4)).toEqual([]);
  });
});

describe("getBookUnits", () => {
  it("bilinen sınıf+ders için üniteleri döner", () => {
    const units = getBookUnits(8, "Matematik");
    expect(units.length).toBeGreaterThan(0);
    expect(units.some((u) => u.code === "M8-01")).toBe(true);
  });
  it("bilinmeyen ders için boş dizi", () => {
    expect(getBookUnits(8, "Yok Böyle Ders")).toEqual([]);
  });
});

describe("bookUnitName", () => {
  it("kodu ada çevirir", () => {
    expect(bookUnitName(8, "Matematik", "M8-02")).toBe("Üslü İfadeler");
  });
  it("katalogda yoksa kodu döner (fallback)", () => {
    expect(bookUnitName(8, "Matematik", "ZZ-99")).toBe("ZZ-99");
  });
});
