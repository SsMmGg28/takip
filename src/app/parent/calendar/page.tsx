import { requireRole } from "@/lib/auth";
import { getAccessibleStudents } from "@/lib/students";
import { getStudentCalendarItems } from "@/lib/calendar";
import { PageHeader } from "@/components/page-header";
import { CalendarView } from "@/components/calendar/calendar-view";
import { EmptyState } from "@/components/empty-state";

export default async function ParentCalendarPage() {
  const profile = await requireRole(["parent"]);
  const students = await getAccessibleStudents(profile);

  if (students.length === 0) {
    return (
      <>
        <PageHeader title="Takvim" />
        <EmptyState title="Henüz bir öğrenciyle eşleştirilmedin" />
      </>
    );
  }

  // Birden fazla çocuk varsa hepsinin etkinlikleri tek takvimde birleşir
  const allItems = (
    await Promise.all(
      students.map((s) => getStudentCalendarItems(s.id, "/parent/homework")),
    )
  ).flat();

  return (
    <>
      <PageHeader
        title="Takvim"
        description="Tüm dersler, ödev teslim tarihleri ve hatırlatmalar."
      />
      <CalendarView items={allItems} />
    </>
  );
}
