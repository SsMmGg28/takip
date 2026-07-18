import { describe, it, expect } from "vitest";
import {
  calculateNet,
  aggregateKazanim,
  type KazanimRowWithContext,
} from "@/lib/exam-shared";

describe("calculateNet", () => {
  it("doğru - yanlış/4 (2 ondalığa yuvarlar)", () => {
    expect(calculateNet(20, 0)).toBe(20);
    expect(calculateNet(18, 4)).toBe(17);
    expect(calculateNet(10, 2)).toBe(9.5);
    expect(calculateNet(5, 1)).toBe(4.75);
    expect(calculateNet(0, 0)).toBe(0);
  });
});

function row(
  o: Partial<KazanimRowWithContext> & {
    subjectName: string;
    kazanim_code: string;
    examId: string;
    correct_count: number;
    incorrect_count: number;
    blank_count: number;
  },
): KazanimRowWithContext {
  return {
    id: o.id ?? `${o.examId}-${o.kazanim_code}`,
    exam_subject_id: o.exam_subject_id ?? "sub",
    kazanim_code: o.kazanim_code,
    kazanim_name: o.kazanim_name ?? o.kazanim_code,
    correct_count: o.correct_count,
    incorrect_count: o.incorrect_count,
    blank_count: o.blank_count,
    subjectName: o.subjectName,
    examId: o.examId,
  };
}

describe("aggregateKazanim", () => {
  it("ders::kod anahtarına göre iki denemeyi toplar; examCount ayrı sayılır", () => {
    const stats = aggregateKazanim([
      {
        ...row({
          subjectName: "Matematik",
          kazanim_code: "M8-02",
          kazanim_name: "Üslü İfadeler",
          examId: "e1",
          correct_count: 3,
          incorrect_count: 1,
          blank_count: 0,
        }),
      },
      row({
        subjectName: "Matematik",
        kazanim_code: "M8-02",
        examId: "e2",
        correct_count: 5,
        incorrect_count: 3,
        blank_count: 2,
      }),
    ]);
    expect(stats).toHaveLength(1);
    const s = stats[0];
    expect(s.subject).toBe("Matematik");
    expect(s.code).toBe("M8-02");
    expect(s.name).toBe("Üslü İfadeler");
    expect(s.correct).toBe(8);
    expect(s.incorrect).toBe(4);
    expect(s.blank).toBe(2);
    expect(s.asked).toBe(14);
    expect(s.examCount).toBe(2);
    expect(s.accuracy).toBe(Math.round((8 / 14) * 100));
    expect(s.wrongRate).toBe(Math.round((4 / 14) * 100));
  });

  it("farklı kodları ayrı satırlar olarak tutar", () => {
    const stats = aggregateKazanim([
      row({ subjectName: "Fen Bilimleri", kazanim_code: "F8-05", examId: "e1", correct_count: 2, incorrect_count: 2, blank_count: 0 }),
      row({ subjectName: "Fen Bilimleri", kazanim_code: "F8-02", examId: "e1", correct_count: 4, incorrect_count: 0, blank_count: 0 }),
    ]);
    expect(stats).toHaveLength(2);
  });

  it("boş girdi → boş dizi", () => {
    expect(aggregateKazanim([])).toEqual([]);
  });
});
