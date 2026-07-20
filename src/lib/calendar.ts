import { createClient } from "@/lib/supabase/server";
import type { CalendarEvent } from "@/lib/types";

export interface CalendarItem {
  id: string;
  title: string;
  description: string | null;
  type: "lesson" | "reminder" | "homework_deadline";
  date: string;
  /** Tıklanınca gidilecek sayfa (örn. ödev teslimi → ödev listesi). */
  href?: string;
}

/** Haftalık tekrarlı etkinliklerin görünüme açılacağı ufuk (gün). */
const RECURRENCE_HORIZON_DAYS = 120;

/**
 * Bir etkinliği takvim öğelerine açar: tekrarsız etkinlik tek öğe,
 * haftalık tekrarlı etkinlik başlangıçtan ufka kadar haftada bir öğe üretir.
 */
export function expandCalendarEvent(
  e: Pick<
    CalendarEvent,
    "id" | "title" | "description" | "type" | "start_at" | "recurrence"
  >,
  titleSuffix = "",
): CalendarItem[] {
  const title = titleSuffix ? `${e.title} — ${titleSuffix}` : e.title;
  const base: Omit<CalendarItem, "id" | "date"> = {
    title,
    description: e.description,
    type: e.type,
  };

  if (e.recurrence !== "weekly") {
    return [{ id: e.id, date: e.start_at, ...base }];
  }

  const items: CalendarItem[] = [];
  const horizon = Date.now() + RECURRENCE_HORIZON_DAYS * 86_400_000;
  const start = new Date(e.start_at);
  for (let i = 0; ; i++) {
    const occurrence = new Date(start.getTime() + i * 7 * 86_400_000);
    if (occurrence.getTime() > horizon) break;
    items.push({
      id: i === 0 ? e.id : `${e.id}@${i}`,
      date: occurrence.toISOString(),
      ...base,
    });
  }
  return items;
}

/** Bir öğrencinin takvim görünümü için ders/hatırlatma + ödev teslim tarihlerini birleştirir. */
export async function getStudentCalendarItems(
  studentId: string,
  homeworkHref?: string,
): Promise<CalendarItem[]> {
  const supabase = await createClient();

  // Ödev teslimleri tek seferlik öğeler: 6 aydan eski olanlar takvimde
  // gösterilmez ki sorgu ödev geçmişiyle sınırsız büyümesin. Etkinlikler
  // SINIRSIZ kalır — haftalık tekrarlı bir etkinliğin başlangıcı eski olabilir,
  // filtrelenirse güncel tekrarları da kaybolur.
  const dueWindowStart = new Date();
  dueWindowStart.setMonth(dueWindowStart.getMonth() - 6);

  const [{ data: events }, { data: homework }] = await Promise.all([
    supabase
      .from("calendar_events")
      .select("id, title, description, type, start_at, recurrence")
      .or(`student_id.eq.${studentId},student_id.is.null`),
    supabase
      .from("homework")
      .select("id, title, due_date")
      .eq("student_id", studentId)
      .not("due_date", "is", null)
      .gte("due_date", dueWindowStart.toISOString().slice(0, 10)),
  ]);

  type EventRow = Pick<
    CalendarEvent,
    "id" | "title" | "description" | "type" | "start_at" | "recurrence"
  >;
  const items: CalendarItem[] = ((events as EventRow[] | null) ?? []).flatMap((e) =>
    expandCalendarEvent(e),
  );

  for (const h of homework ?? []) {
    items.push({
      id: `hw-${h.id}`,
      title: `Ödev teslim: ${h.title}`,
      description: null,
      type: "homework_deadline",
      date: h.due_date,
      href: homeworkHref,
    });
  }

  return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
