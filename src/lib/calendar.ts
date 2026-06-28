import { createClient } from "@/lib/supabase/server";

export interface CalendarItem {
  id: string;
  title: string;
  description: string | null;
  type: "lesson" | "reminder" | "homework_deadline";
  date: string;
}

/** Bir öğrencinin takvim görünümü için ders/hatırlatma + ödev teslim tarihlerini birleştirir. */
export async function getStudentCalendarItems(studentId: string): Promise<CalendarItem[]> {
  const supabase = await createClient();

  const [{ data: events }, { data: homework }] = await Promise.all([
    supabase
      .from("calendar_events")
      .select("*")
      .or(`student_id.eq.${studentId},student_id.is.null`),
    supabase
      .from("homework")
      .select("id, title, due_date")
      .eq("student_id", studentId)
      .not("due_date", "is", null),
  ]);

  const items: CalendarItem[] = [];

  for (const e of events ?? []) {
    items.push({
      id: e.id,
      title: e.title,
      description: e.description,
      type: e.type,
      date: e.start_at,
    });
  }

  for (const h of homework ?? []) {
    items.push({
      id: `hw-${h.id}`,
      title: `Ödev teslim: ${h.title}`,
      description: null,
      type: "homework_deadline",
      date: h.due_date,
    });
  }

  return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
