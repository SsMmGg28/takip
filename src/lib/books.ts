import { createClient } from "@/lib/supabase/server";
import type { ResourceBook, ResourceBookSection, StudentTestProgress } from "@/lib/types";

export interface BookWithSections extends ResourceBook {
  sections: ResourceBookSection[];
  totalTests: number;
}

export async function getApprovedBooks(): Promise<BookWithSections[]> {
  const supabase = await createClient();
  const { data: books } = await supabase
    .from("resource_books")
    .select("*")
    .eq("approved", true)
    .order("name");

  if (!books?.length) return [];

  const { data: sections } = await supabase
    .from("resource_book_sections")
    .select("*")
    .in(
      "book_id",
      books.map((b) => b.id),
    )
    .order("order_index", { ascending: true });

  return (books as ResourceBook[]).map((b) => {
    const ss = ((sections as ResourceBookSection[]) ?? []).filter((s) => s.book_id === b.id);
    return {
      ...b,
      sections: ss,
      totalTests: ss.reduce((acc, s) => acc + s.test_count, 0),
    };
  });
}

export async function getStudentProgressForBook(studentId: string, bookId: string) {
  const supabase = await createClient();

  const { data: book } = await supabase
    .from("resource_books")
    .select("*")
    .eq("id", bookId)
    .single();
  if (!book) return null;

  const { data: sections } = await supabase
    .from("resource_book_sections")
    .select("*")
    .eq("book_id", bookId)
    .order("order_index", { ascending: true });

  const { data: progress } = await supabase
    .from("student_test_progress")
    .select("*")
    .eq("student_id", studentId)
    .in(
      "section_id",
      (sections ?? []).map((s) => s.id),
    );

  const completedBySection = new Map<string, Set<number>>();
  for (const p of (progress as StudentTestProgress[]) ?? []) {
    if (!completedBySection.has(p.section_id)) {
      completedBySection.set(p.section_id, new Set());
    }
    completedBySection.get(p.section_id)!.add(p.test_number);
  }

  const totalTests = (sections ?? []).reduce((acc, s) => acc + s.test_count, 0);
  const completedCount = (progress ?? []).length;

  return {
    book: book as ResourceBook,
    sections: (sections as ResourceBookSection[]) ?? [],
    completedBySection,
    totalTests,
    completedCount,
  };
}

export async function getStudentBookOverview(studentId: string) {
  const supabase = await createClient();
  const books = await getApprovedBooks();
  if (!books.length) return [];

  const allSectionIds = books.flatMap((b) => b.sections.map((s) => s.id));
  if (!allSectionIds.length) return books.map((b) => ({ ...b, completedCount: 0 }));

  const { data: progress } = await supabase
    .from("student_test_progress")
    .select("section_id")
    .eq("student_id", studentId)
    .in("section_id", allSectionIds);

  const countBySection = new Map<string, number>();
  for (const p of progress ?? []) {
    countBySection.set(p.section_id, (countBySection.get(p.section_id) ?? 0) + 1);
  }

  return books.map((b) => ({
    ...b,
    completedCount: b.sections.reduce((acc, s) => acc + (countBySection.get(s.id) ?? 0), 0),
  }));
}
