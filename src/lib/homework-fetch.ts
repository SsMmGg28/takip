import { createClient } from "@/lib/supabase/server";
import type {
  Homework,
  HomeworkTest,
  Profile,
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

async function buildContext(list: Homework[]): Promise<HomeworkListContext> {
  const supabase = await createClient();

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
      tests: (testsByHomework.get(h.id) ?? []).sort(
        (a, b) => a.test_number - b.test_number,
      ),
    })),
    sectionById,
  };
}

export async function getHomeworkForStudent(studentId: string): Promise<HomeworkListContext> {
  const supabase = await createClient();

  const { data: homework } = await supabase
    .from("homework")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  return buildContext((homework as Homework[] | null) ?? []);
}

// ── Öğretmen: toplu gönderim grupları ──────────────────────────────────────

export interface AssignmentGroup {
  groupId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  book: ResourceBook | null;
  createdAt: string;
  attachmentName: string | null;
  /** Gruptaki her öğrencinin ödevi (kontrol durumu dahil). */
  entries: { homework: Homework; student: Profile | null; tests: HomeworkTest[] }[];
  sectionById: Map<string, ResourceBookSection>;
}

/** Ödev merkezinin gösterdiği geçmiş penceresi (ay). Sorgu sınırsız büyümesin. */
const ASSIGNMENT_WINDOW_MONTHS = 6;

/** Son 6 ayın ödevlerini toplu gönderim gruplarına ayırır (öğretmen merkezi). */
export async function getAssignmentGroups(): Promise<AssignmentGroup[]> {
  const supabase = await createClient();

  const windowStart = new Date();
  windowStart.setMonth(windowStart.getMonth() - ASSIGNMENT_WINDOW_MONTHS);

  const { data: homework } = await supabase
    .from("homework")
    .select("*")
    .gte("created_at", windowStart.toISOString())
    .order("created_at", { ascending: false });

  const list = (homework as Homework[] | null) ?? [];
  if (!list.length) return [];

  // profiles sorgusu yalnızca list'e bağlı; buildContext ile paralel çalışabilir.
  const studentIds = Array.from(new Set(list.map((h) => h.student_id)));
  const [{ items, sectionById }, { data: students }] = await Promise.all([
    buildContext(list),
    supabase.from("profiles").select("*").in("id", studentIds),
  ]);
  const studentById = new Map(
    ((students as Profile[] | null) ?? []).map((s) => [s.id, s]),
  );

  const groups = new Map<string, AssignmentGroup>();
  for (const it of items) {
    const h = it.homework;
    let g = groups.get(h.assignment_group_id);
    if (!g) {
      g = {
        groupId: h.assignment_group_id,
        title: h.title,
        description: h.description,
        dueDate: h.due_date,
        book: it.book,
        createdAt: h.created_at,
        attachmentName: h.attachment_name,
        entries: [],
        sectionById,
      };
      groups.set(h.assignment_group_id, g);
    }
    g.entries.push({
      homework: h,
      student: studentById.get(h.student_id) ?? null,
      tests: it.tests,
    });
  }

  for (const g of groups.values()) {
    g.entries.sort((a, b) =>
      (a.student?.full_name ?? "").localeCompare(b.student?.full_name ?? "", "tr"),
    );
  }

  return Array.from(groups.values()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}
