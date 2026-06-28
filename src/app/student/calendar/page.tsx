import { requireRole } from "@/lib/auth";
import { getStudentCalendarItems } from "@/lib/calendar";
import { CalendarList } from "@/components/calendar-list";

export default async function StudentCalendarPage() {
  const profile = await requireRole(["student"]);
  const items = await getStudentCalendarItems(profile.id);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Takvim</h1>
      <CalendarList items={items} />
    </div>
  );
}
