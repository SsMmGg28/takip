import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { CalendarView } from "@/components/calendar/calendar-view";
import { CreateCalendarEventDialog } from "@/components/teacher/create-calendar-event-dialog";
import { EventManageList } from "@/components/teacher/event-manage-list";
import { expandCalendarEvent, type CalendarItem } from "@/lib/calendar";
import type { CalendarEvent, Profile } from "@/lib/types";

export const metadata = { title: "Takvim" };

export default async function TeacherCalendarPage() {
  const supabase = await createClient();

  const [{ data: students }, { data: events }, { data: homework }] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "student").order("full_name"),
    supabase.from("calendar_events").select("*").order("start_at", { ascending: true }),
    supabase
      .from("homework")
      .select("id, title, due_date, student_id")
      .not("due_date", "is", null),
  ]);

  const studentNameById = new Map(
    ((students as Profile[] | null) ?? []).map((s) => [s.id, s.full_name]),
  );

  const eventList = (events as CalendarEvent[] | null) ?? [];
  const items: CalendarItem[] = [];
  for (const e of eventList) {
    const studentLabel = e.student_id ? (studentNameById.get(e.student_id) ?? "") : "";
    items.push(...expandCalendarEvent(e, studentLabel));
  }
  for (const h of homework ?? []) {
    const studentLabel = studentNameById.get(h.student_id) ?? "";
    items.push({
      id: `hw-${h.id}`,
      title: `Ödev teslim: ${h.title}${studentLabel ? " — " + studentLabel : ""}`,
      description: null,
      type: "homework_deadline",
      date: h.due_date as string,
      href: `/teacher/homework/${h.student_id}`,
    });
  }
  items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <>
      <PageHeader
        title="Takvim"
        description="Dersler, ödev teslim tarihleri ve genel hatırlatmalar."
        action={<CreateCalendarEventDialog students={(students as Profile[]) ?? []} />}
      />
      <CalendarView items={items} />
      <EventManageList events={eventList} students={(students as Profile[]) ?? []} />
    </>
  );
}
