import { createClient } from "@/lib/supabase/server";
import type {
  Profile,
  ResourceBook,
  ResourceBookSection,
  StudentTestProgress,
} from "@/lib/types";

export interface BookWithSections extends ResourceBook {
  sections: ResourceBookSection[];
  totalTests: number;
}

export interface ShelfBook extends BookWithSections {
  completedCount: number;
  studentBookId: string;
}

async function attachSections(books: ResourceBook[]): Promise<BookWithSections[]> {
  if (!books.length) return [];
  const supabase = await createClient();
  const { data: sections } = await supabase
    .from("resource_book_sections")
    .select("*")
    .in(
      "book_id",
      books.map((b) => b.id),
    )
    .order("order_index", { ascending: true });

  return books.map((b) => {
    const ss = ((sections as ResourceBookSection[]) ?? []).filter((s) => s.book_id === b.id);
    return {
      ...b,
      sections: ss,
      totalTests: ss.reduce((acc, s) => acc + s.test_count, 0),
    };
  });
}

/**
 * Onaylı katalog (kütüphane). `grade` verilirse yalnızca o sınıfın kitapları
 * döner — veli görünümünde çocuğun sınıfı dışındaki kitapları hiç göstermemek için.
 */
export async function getApprovedBooks(options?: {
  grade?: number | null;
}): Promise<BookWithSections[]> {
  const supabase = await createClient();
  let query = supabase.from("resource_books").select("*").eq("approved", true);
  if (options?.grade != null) query = query.eq("grade_level", options.grade);
  const { data: books } = await query.order("name");
  return attachSections((books as ResourceBook[]) ?? []);
}

/** Onay bekleyen kitaplar (öğretmen hepsini, veli kendininkini görür — RLS halleder). */
export async function getPendingBooks(): Promise<BookWithSections[]> {
  const supabase = await createClient();
  const { data: books } = await supabase
    .from("resource_books")
    .select("*")
    .eq("approved", false)
    .order("created_at", { ascending: false });
  return attachSections((books as ResourceBook[]) ?? []);
}

/** Bir öğrencinin kitaplığı: veli tarafından atanan kitaplar + ilerleme sayıları. */
export async function getStudentShelf(studentId: string): Promise<ShelfBook[]> {
  const supabase = await createClient();

  const { data: links } = await supabase
    .from("student_books")
    .select("id, book_id")
    .eq("student_id", studentId)
    .order("created_at", { ascending: true });

  if (!links?.length) return [];

  const { data: books } = await supabase
    .from("resource_books")
    .select("*")
    .in(
      "id",
      links.map((l) => l.book_id),
    )
    .eq("approved", true)
    .order("name");

  const withSections = await attachSections((books as ResourceBook[]) ?? []);
  const allSectionIds = withSections.flatMap((b) => b.sections.map((s) => s.id));

  const countBySection = new Map<string, number>();
  if (allSectionIds.length) {
    const { data: progress } = await supabase
      .from("student_test_progress")
      .select("section_id")
      .eq("student_id", studentId)
      .in("section_id", allSectionIds);
    for (const p of progress ?? []) {
      countBySection.set(p.section_id, (countBySection.get(p.section_id) ?? 0) + 1);
    }
  }

  const linkByBook = new Map(links.map((l) => [l.book_id, l.id]));
  return withSections.map((b) => ({
    ...b,
    studentBookId: linkByBook.get(b.id)!,
    completedCount: b.sections.reduce(
      (acc, s) => acc + (countBySection.get(s.id) ?? 0),
      0,
    ),
  }));
}

/** Kitaplık ataması var mı? (öğrenci sayfaları için koruma) */
export async function isBookOnShelf(studentId: string, bookId: string): Promise<boolean> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("student_books")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .eq("book_id", bookId);
  return (count ?? 0) > 0;
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

export interface BookStudentProgress {
  student: Profile;
  completedCount: number;
}

/** Bir kitabı kitaplığında bulunduran öğrenciler + kitaptaki ilerlemeleri (öğretmen görünümü). */
export async function getBookStudents(bookId: string): Promise<BookStudentProgress[]> {
  const supabase = await createClient();

  const { data: links } = await supabase
    .from("student_books")
    .select("student_id")
    .eq("book_id", bookId);
  if (!links?.length) return [];

  const studentIds = links.map((l) => l.student_id);

  const [{ data: students }, { data: sections }] = await Promise.all([
    supabase.from("profiles").select("*").in("id", studentIds).order("full_name"),
    supabase.from("resource_book_sections").select("id").eq("book_id", bookId),
  ]);

  const sectionIds = (sections ?? []).map((s) => s.id);
  const countByStudent = new Map<string, number>();
  if (sectionIds.length) {
    const { data: progress } = await supabase
      .from("student_test_progress")
      .select("student_id")
      .in("student_id", studentIds)
      .in("section_id", sectionIds);
    for (const p of progress ?? []) {
      countByStudent.set(p.student_id, (countByStudent.get(p.student_id) ?? 0) + 1);
    }
  }

  return ((students as Profile[]) ?? []).map((s) => ({
    student: s,
    completedCount: countByStudent.get(s.id) ?? 0,
  }));
}
