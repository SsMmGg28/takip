import { requireRole } from "@/lib/auth";
import { getAccessibleStudents } from "@/lib/students";
import { getStudentCalendarItems } from "@/lib/calendar";
import { CalendarList } from "@/components/calendar-list";

export default async function ParentCalendarPage() {
  const profile = await requireRole(["parent"]);
  const students = await getAccessibleStudents(profile);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold">Takvim</h1>
      {students.length === 0 && (
        <p className="text-muted-foreground">Eşleştirilmiş öğrenci bulunamadı.</p>
      )}
      {await Promise.all(
        students.map(async (student) => {
          const items = await getStudentCalendarItems(student.id);
          return (
            <section key={student.id} className="flex flex-col gap-2">
              <h2 className="font-medium text-muted-foreground">{student.full_name}</h2>
              <CalendarList items={items} />
            </section>
          );
        }),
      )}
    </div>
  );
}
