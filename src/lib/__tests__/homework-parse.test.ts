import { describe, it, expect } from "vitest";
import { parseTestEntries } from "@/lib/homework-parse";

function testsForm(entries: string[]): FormData {
  const fd = new FormData();
  for (const e of entries) fd.append("tests", e);
  return fd;
}

describe("parseTestEntries", () => {
  it("'sectionId:testNumber' girdilerini ayrıştırır", () => {
    expect(parseTestEntries(testsForm(["sec1:3", "sec2:1"]))).toEqual([
      { section_id: "sec1", test_number: 3 },
      { section_id: "sec2", test_number: 1 },
    ]);
  });

  it("test numarası 0/negatif, bölüm kimliği boş veya sayı olmayan girdileri eler", () => {
    expect(parseTestEntries(testsForm(["sec1:0", ":5", "sec2:abc", "sec3:2"]))).toEqual([
      { section_id: "sec3", test_number: 2 },
    ]);
  });

  it("hiç girdi yoksa boş dizi", () => {
    expect(parseTestEntries(new FormData())).toEqual([]);
  });
});
