import { GRADE_8_CURRICULUM } from "@/lib/curriculum/grade-8";
import type { CurriculumOutcome, CurriculumSubject } from "@/lib/curriculum/types";

export type { CurriculumOutcome, CurriculumUnit, CurriculumSubject } from "@/lib/curriculum/types";
export { GRADE_8_CURRICULUM };

// Sadece 8. sınıf kazanımları elimizde var; yeni sınıflar eklendikçe burada büyüyecek.
const CURRICULUM_BY_GRADE: Record<number, CurriculumSubject[]> = {
  8: GRADE_8_CURRICULUM,
};

export function getCurriculumForGrade(gradeLevel: number | null | undefined): CurriculumSubject[] {
  if (!gradeLevel) return [];
  return CURRICULUM_BY_GRADE[gradeLevel] ?? [];
}

function normalize(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/[^a-zçğıöşü\s]/g, "")
    .trim();
}

// Ders adları uygulamada serbest metin olarak girildiği için (ör. "Matematik", "T.C. İnkılap Tarihi")
// birebir eşleşme yerine anahtar kelime bazlı eşleştirme kullanılır.
const SUBJECT_KEYWORDS: Record<string, string[]> = {
  Türkçe: ["türkçe"],
  Matematik: ["matematik"],
  "Fen Bilimleri": ["fen"],
  "T.C. İnkılap Tarihi ve Atatürkçülük": ["inkılap", "atatürkçülük", "inkilap"],
  "Din Kültürü ve Ahlak Bilgisi": ["din kültürü", "din kulturu", "ahlak"],
  İngilizce: ["ingilizce", "i̇ngilizce", "english"],
};

export function findSubjectCurriculum(
  gradeLevel: number | null | undefined,
  subjectName: string,
): CurriculumSubject | null {
  const subjects = getCurriculumForGrade(gradeLevel);
  if (!subjects.length) return null;

  const normalizedInput = normalize(subjectName);
  for (const subject of subjects) {
    const keywords = SUBJECT_KEYWORDS[subject.subject] ?? [normalize(subject.subject)];
    if (keywords.some((keyword) => normalizedInput.includes(normalize(keyword)))) {
      return subject;
    }
  }
  return null;
}

export function getTopicSuggestions(
  gradeLevel: number | null | undefined,
  subjectName: string,
): CurriculumOutcome[] {
  const subject = findSubjectCurriculum(gradeLevel, subjectName);
  if (!subject) return [];
  return subject.units.flatMap((unit) => unit.outcomes);
}
