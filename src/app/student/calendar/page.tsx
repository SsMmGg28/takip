import { requireRole } from "@/lib/auth";
import { getStudentCalendarItems } from "@/lib/calendar";
import { PageHeader } from "@/components/page-header";
import { CalendarView } from "@/components/calendar/calendar-view";

export const metadata = { title: "Takvim" };

export default async function StudentCalendarPage() {
  const profile = await requireRole(["student"]);
  const items = await getStudentCalendarItems(profile.id, "/student/homework");

  return (
    <>
      <PageHeader
        title="Takvim"
        description="Dersler, ödev teslim tarihleri ve hatırlatmalar."
      />
      <CalendarView items={items} />
    </>
  );
}
