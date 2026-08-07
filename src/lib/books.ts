import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Profile,
  ResourceBook,
  ResourceBookSection,
  StudentTestProgress,
} from "@/lib/types";

/** Onaylı katalog cache'inin etiketi; kitap/bölüm değiştiren aksiyonlar bunu günceller. */
export const BOOK_CATALOG_TAG = "book-catalog";

export interface BookWithSections extends ResourceBook {
  sections: ResourceBookSection[];
  totalTests: number;
}

export interface ShelfBook extends BookWithSections {
  completedCount: number;
  studentBookId: string;
}

/** PostgREST embedded satır şekli: resource_books + bölümleri. */
type BookWithSectionsRow = ResourceBook & {
  resource_book_sections: ResourceBookSection[];
};

/** Embedded gelen bölümleri sıralayıp BookWithSections'a düzler (sorgu yok). */
function flattenSections(rows: BookWithSectionsRow[]): BookWithSections[] {
  return rows.map(({ resource_book_sections, ...b }) => {
    const ss = [...resource_book_sections].sort((a, x) => a.order_index - x.order_index);
    return {
      ...(b as ResourceBook),
      sections: ss,
      totalTests: ss.reduce((acc, s) => acc + s.test_count, 0),
    };
  });
}

/** Kitap sorgularında bölümleri aynı sorguda getiren ortak select ifadesi. */
const BOOK_WITH_SECTIONS = "*, resource_book_sections(*)";

/**
 * Onaylı katalog (kütüphane). `grade` verilirse yalnızca o sınıfın kitapları
 * döner — veli görünümünde çocuğun sınıfı dışındaki kitapları hiç göstermemek için.
 *
 * "use cache": onaylı kitaplar RLS'te TÜM kimlikli kullanıcılara aynı görünür
 * (0003 books_select_approved; demo izolasyonu bu tabloya uygulanmaz), bu
 * yüzden çerezsiz service-role istemciyle okunup kullanıcıdan bağımsız
 * cache'lenebilir. Katalog değiştiren aksiyonlar BOOK_CATALOG_TAG'i günceller.
 */
export async function getApprovedBooks(options?: {
  grade?: number | null;
}): Promise<BookWithSections[]> {
  "use cache";
  cacheTag(BOOK_CATALOG_TAG);
  cacheLife("hours");

  const supabase = createAdminClient();
  let query = supabase
    .from("resource_books")
    .select(BOOK_WITH_SECTIONS)
    .eq("approved", true);
  if (options?.grade != null) query = query.eq("grade_level", options.grade);
  const { data: books } = await query.order("name");
  return flattenSections((books as BookWithSectionsRow[] | null) ?? []);
}

/** Onay bekleyen kitaplar (öğretmen hepsini, veli kendininkini görür — RLS halleder). */
export async function getPendingBooks(): Promise<BookWithSections[]> {
  const supabase = await createClient();
  const { data: books } = await supabase
    .from("resource_books")
    .select(BOOK_WITH_SECTIONS)
    .eq("approved", false)
    .order("created_at", { ascending: false });
  return flattenSections((books as BookWithSectionsRow[] | null) ?? []);
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

  // Kitaplar (bölümleriyle embedded) ve öğrencinin tüm test ilerlemesi
  // paralel çekilir; ilerleme bölüm kümesine bellekte daraltılır.
  const [{ data: books }, { data: progress }] = await Promise.all([
    supabase
      .from("resource_books")
      .select(BOOK_WITH_SECTIONS)
      .in(
        "id",
        links.map((l) => l.book_id),
      )
      .eq("approved", true)
      .order("name"),
    supabase
      .from("student_test_progress")
      .select("section_id")
      .eq("student_id", studentId),
  ]);

  const withSections = flattenSections((books as BookWithSectionsRow[] | null) ?? []);
  const allSectionIds = new Set(withSections.flatMap((b) => b.sections.map((s) => s.id)));

  const countBySection = new Map<string, number>();
  for (const p of progress ?? []) {
    if (!allSectionIds.has(p.section_id)) continue;
    countBySection.set(p.section_id, (countBySection.get(p.section_id) ?? 0) + 1);
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

  // Önce kitabın bölüm kimliklerini öğren, sonra yalnız o kitaba ait ilerlemeyi
  // getir. Öğrencinin yıllar içinde büyüyen bütün test geçmişini taşımayız.
  const { data: bookRow } = await supabase
    .from("resource_books")
    .select(BOOK_WITH_SECTIONS)
    .eq("id", bookId)
    .single();
  if (!bookRow) return null;

  const { resource_book_sections, ...book } = bookRow as BookWithSectionsRow;
  const sections = [...resource_book_sections].sort(
    (a, b) => a.order_index - b.order_index,
  );
  const sectionIds = sections.map((s) => s.id);
  const { data: progressRows } = sectionIds.length
    ? await supabase
        .from("student_test_progress")
        .select("*")
        .eq("student_id", studentId)
        .in("section_id", sectionIds)
    : { data: [] };
  const progress = (progressRows as StudentTestProgress[] | null) ?? [];

  const completedBySection = new Map<string, Set<number>>();
  for (const p of progress) {
    if (!completedBySection.has(p.section_id)) {
      completedBySection.set(p.section_id, new Set());
    }
    completedBySection.get(p.section_id)!.add(p.test_number);
  }

  const totalTests = sections.reduce((acc, s) => acc + s.test_count, 0);
  const completedCount = progress.length;

  return {
    book: book as ResourceBook,
    sections,
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
