import { createClient } from "@/lib/supabase/server";
import { getStudentGrade } from "@/lib/students";
import { getKazanimAnalysis } from "@/lib/exam-analysis";
import { examsEnabledForGrade } from "@/lib/kazanim";
import {
  pickRecommendation,
  type CandidateSection,
  type KazanimRecommendation,
} from "@/lib/exams/recommendations";

const MAX_RECOMMENDATIONS = 8;

/** Supabase gömülü (inner join) satır şekli. */
interface SectionJoinRow {
  id: string;
  name: string;
  test_count: number;
  kazanim_code: string | null;
  book_id: string;
  resource_books: {
    id: string;
    name: string;
    grade_level: number | null;
    approved: boolean;
    difficulty: number | null;
  } | null;
}

/**
 * Bir öğrenci için kazanım→kitap önerileri. Zayıf kazanımlar (son 10 denemeden
 * hesaplanan öncelik listesi) ile o kazanıma uyan onaylı, öğrencinin sınıfındaki
 * kitap bölümleri eşleştirilir; her biri için başarıya uygun zorlukta ve
 * çözülmemiş bölüm seçilir. Yalnızca 7-8. sınıf (deneme aktif) için çalışır.
 */
export async function getKazanimRecommendations(
  studentId: string,
): Promise<KazanimRecommendation[]> {
  const grade = await getStudentGrade(studentId);
  if (!examsEnabledForGrade(grade)) return [];

  const analysis = await getKazanimAnalysis(studentId);
  const weak = analysis.priorities.slice(0, MAX_RECOMMENDATIONS);
  if (weak.length === 0) return [];

  const codes = Array.from(new Set(weak.map((w) => w.code)));
  const supabase = await createClient();

  // Aday bölümler: kod + sınıf eşleşen onaylı kitap bölümleri (kod sınıfa özel ve
  // benzersiz olduğundan ders adına güvenmeye gerek yok).
  const { data: sectionData } = await supabase
    .from("resource_book_sections")
    .select(
      "id, name, test_count, kazanim_code, book_id, resource_books!inner(id, name, grade_level, approved, difficulty)",
    )
    .in("kazanim_code", codes)
    .eq("resource_books.grade_level", grade)
    .eq("resource_books.approved", true);

  const sections = (sectionData as unknown as SectionJoinRow[]) ?? [];
  if (sections.length === 0) {
    // Kitap yok; yine de zayıf kazanımları "kitap yok" olarak bildir.
    return weak.map((w) => pickRecommendation(w, []));
  }

  const sectionIds = sections.map((s) => s.id);
  const bookIds = Array.from(new Set(sections.map((s) => s.book_id)));

  const [{ data: progress }, { data: shelf }] = await Promise.all([
    supabase
      .from("student_test_progress")
      .select("section_id, test_number")
      .eq("student_id", studentId)
      .in("section_id", sectionIds),
    supabase
      .from("student_books")
      .select("book_id")
      .eq("student_id", studentId)
      .in("book_id", bookIds),
  ]);

  const solvedBySection = new Map<string, Set<number>>();
  for (const p of progress ?? []) {
    if (!solvedBySection.has(p.section_id)) solvedBySection.set(p.section_id, new Set());
    solvedBySection.get(p.section_id)!.add(p.test_number);
  }
  const shelfBookIds = new Set((shelf ?? []).map((r) => r.book_id));

  // Kazanım koduna göre adayları grupla.
  const candidatesByCode = new Map<string, CandidateSection[]>();
  for (const row of sections) {
    const book = row.resource_books;
    if (!book || !row.kazanim_code) continue;
    const candidate: CandidateSection = {
      sectionId: row.id,
      sectionName: row.name,
      bookId: row.book_id,
      bookName: book.name,
      testCount: row.test_count,
      difficulty: book.difficulty,
      solvedTests: solvedBySection.get(row.id) ?? new Set<number>(),
      onShelf: shelfBookIds.has(row.book_id),
    };
    if (!candidatesByCode.has(row.kazanim_code))
      candidatesByCode.set(row.kazanim_code, []);
    candidatesByCode.get(row.kazanim_code)!.push(candidate);
  }

  return weak.map((w) => pickRecommendation(w, candidatesByCode.get(w.code) ?? []));
}
