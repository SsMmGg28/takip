import { createClient } from "@/lib/supabase/server";
import type {
  Homework,
  HomeworkTest,
  ResourceBook,
  ResourceBookSection,
} from "@/lib/types";

export interface HomeworkBundle {
  homework: Homework;
  book: ResourceBook | null;
  tests: HomeworkTest[];
}

export interface HomeworkListContext {
  items: HomeworkBundle[];
  sectionById: Map<string, ResourceBookSection>;
}

export async function getHomeworkForStudent(studentId: string): Promise<HomeworkListContext> {
  const supabase = await createClient();

  const { data: homework } = await supabase
    .from("homework")
    .select("*")
    .eq("student_id", studentId)
    .order("due_date", { ascending: true, nullsFirst: false });

  const list = (homework as Homework[] | null) ?? [];

  if (list.length === 0) {
    return { items: [], sectionById: new Map() };
  }

  const homeworkIds = list.map((h) => h.id);
  const bookIds = Array.from(
    new Set(list.map((h) => h.book_id).filter((b): b is string => Boolean(b))),
  );

  const [{ data: tests }, { data: books }] = await Promise.all([
    supabase.from("homework_tests").select("*").in("homework_id", homeworkIds),
    bookIds.length
      ? supabase.from("resource_books").select("*").in("id", bookIds)
      : Promise.resolve({ data: [] }),
  ]);

  const sectionIds = Array.from(
    new Set(((tests as HomeworkTest[] | null) ?? []).map((t) => t.section_id)),
  );

  const { data: sections } = sectionIds.length
    ? await supabase.from("resource_book_sections").select("*").in("id", sectionIds)
    : { data: [] };

  const bookById = new Map(
    ((books as ResourceBook[] | null) ?? []).map((b) => [b.id, b]),
  );
  const testsByHomework = new Map<string, HomeworkTest[]>();
  for (const t of (tests as HomeworkTest[] | null) ?? []) {
    if (!testsByHomework.has(t.homework_id)) testsByHomework.set(t.homework_id, []);
    testsByHomework.get(t.homework_id)!.push(t);
  }
  const sectionById = new Map<string, ResourceBookSection>();
  for (const s of (sections as ResourceBookSection[] | null) ?? []) {
    sectionById.set(s.id, s);
  }

  return {
    items: list.map((h) => ({
      homework: h,
      book: h.book_id ? bookById.get(h.book_id) ?? null : null,
      tests: testsByHomework.get(h.id) ?? [],
    })),
    sectionById,
  };
}
