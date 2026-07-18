import { describe, it, expect } from "vitest";
import {
  parseSections,
  parseGrade,
  parseDifficulty,
  planSectionSync,
  sectionKey,
  type ExistingSection,
  type SectionInput,
} from "@/lib/resources-parse";

function sectionForm(
  rows: { name: string; count: string | number; code?: string }[],
): FormData {
  const fd = new FormData();
  for (const r of rows) {
    fd.append("section_name", r.name);
    fd.append("section_test_count", String(r.count));
    fd.append("section_kazanim_code", r.code ?? "");
  }
  return fd;
}

describe("parseSections", () => {
  it("geçerli satırları okur, kodu boşsa null yapar", () => {
    const out = parseSections(
      sectionForm([
        { name: "Üslü", count: 10, code: "M8-02" },
        { name: "Serbest", count: 5 },
      ]),
    );
    expect(out).toEqual([
      { name: "Üslü", testCount: 10, kazanimCode: "M8-02" },
      { name: "Serbest", testCount: 5, kazanimCode: null },
    ]);
  });

  it("test sayısı 0, >200, NaN veya adı boş satırları atlar", () => {
    const out = parseSections(
      sectionForm([
        { name: "Sıfır", count: 0 },
        { name: "Aşırı", count: 201 },
        { name: "Bozuk", count: "abc" },
        { name: "", count: 10 },
        { name: "Sınır", count: 200, code: "X" },
      ]),
    );
    expect(out).toEqual([{ name: "Sınır", testCount: 200, kazanimCode: "X" }]);
  });

  it("adın başındaki/sonundaki boşlukları temizler", () => {
    const out = parseSections(sectionForm([{ name: "  Konu  ", count: 3 }]));
    expect(out[0].name).toBe("Konu");
  });
});

describe("parseGrade", () => {
  it("5-8 arası döner, dışını null yapar", () => {
    for (const g of [5, 6, 7, 8]) {
      const fd = new FormData();
      fd.set("grade_level", String(g));
      expect(parseGrade(fd)).toBe(g);
    }
    for (const bad of ["4", "9", "", "abc"]) {
      const fd = new FormData();
      fd.set("grade_level", bad);
      expect(parseGrade(fd)).toBeNull();
    }
  });
});

describe("parseDifficulty", () => {
  it("1-5 arası yuvarlar, dışını null yapar", () => {
    const mk = (v: string) => {
      const fd = new FormData();
      fd.set("difficulty", v);
      return parseDifficulty(fd);
    };
    expect(mk("3")).toBe(3);
    expect(mk("4.6")).toBe(5);
    expect(mk("1")).toBe(1);
    expect(mk("0")).toBeNull();
    expect(mk("6")).toBeNull();
    expect(mk("")).toBeNull();
    expect(mk("abc")).toBeNull();
  });
});

describe("sectionKey", () => {
  it("kod varsa koda, yoksa tr-küçük ada göre anahtar üretir", () => {
    expect(sectionKey("Üslü", "M8-02")).toBe("c:M8-02");
    expect(sectionKey("  İMLA  ", null)).toBe("n:imla");
  });
});

describe("planSectionSync", () => {
  const existing: ExistingSection[] = [
    { id: "s1", name: "Üslü", kazanim_code: "M8-02" },
    { id: "s2", name: "Kareköklü", kazanim_code: "M8-03" },
    { id: "s3", name: "Serbest Konu", kazanim_code: null },
  ];

  it("koda göre eşleşeni günceller (id korunur), yeniyi ekler, düşeni siler", () => {
    const desired: SectionInput[] = [
      { name: "Üslü İfadeler", testCount: 12, kazanimCode: "M8-02" }, // s1 update
      { name: "Üçgenler", testCount: 8, kazanimCode: "M8-09" }, // insert
    ];
    const plan = planSectionSync(existing, desired);
    expect(plan.toUpdate).toEqual([
      { id: "s1", name: "Üslü İfadeler", testCount: 12, kazanimCode: "M8-02", orderIndex: 0 },
    ]);
    expect(plan.toInsert).toEqual([
      { name: "Üçgenler", testCount: 8, kazanimCode: "M8-09", orderIndex: 1 },
    ]);
    // s2 ve s3 istenen listede yok → silinir
    expect(plan.toDeleteIds.sort()).toEqual(["s2", "s3"]);
  });

  it("kodsuz bölümü ada göre eşleştirir (tr-küçük)", () => {
    const desired: SectionInput[] = [
      { name: "serbest konu", testCount: 4, kazanimCode: null },
    ];
    const plan = planSectionSync(existing, desired);
    expect(plan.toUpdate.map((u) => u.id)).toEqual(["s3"]);
    expect(plan.toInsert).toHaveLength(0);
  });

  it("istenen listede tekrar eden anahtarı atlar", () => {
    const desired: SectionInput[] = [
      { name: "Üslü", testCount: 10, kazanimCode: "M8-02" },
      { name: "Üslü tekrar", testCount: 5, kazanimCode: "M8-02" },
    ];
    const plan = planSectionSync([], desired);
    expect(plan.toInsert).toHaveLength(1);
    expect(plan.toInsert[0].testCount).toBe(10);
  });
});
