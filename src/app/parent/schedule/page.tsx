import { requireRole } from "@/lib/auth";
import { getAccessibleStudents } from "@/lib/students";
import { createClient } from "@/lib/supabase/server";
import { AddScheduleEntryDialog } from "@/components/schedule/add-schedule-entry-dialog";
import { WeeklySchedule } from "@/components/schedule/weekly-schedule";
import type { StudyScheduleEntry } from "@/lib/types";

export default async function ParentSchedulePage() {
  const profile = await requireRole(["parent"]);
  const students = await getAccessibleStudents(profile);
  const supabase = await createClient();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold">Çalışma Programı</h1>
      {students.length === 0 && (
        <p className="text-muted-foreground">Eşleştirilmiş öğrenci bulunamadı.</p>
      )}
      {await Promise.all(
        students.map(async (student) => {
          const { data: entries } = await supabase
            .from("study_schedule_entries")
            .select("*")
            .eq("student_id", student.id);

          const redirectPath = "/parent/schedule";

          return (
            <section key={student.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h2 className="font-medium text-muted-foreground">{student.full_name}</h2>
                <AddScheduleEntryDialog studentId={student.id} redirectPath={redirectPath} />
              </div>
              <WeeklySchedule
                entries={(entries as StudyScheduleEntry[]) ?? []}
                redirectPath={redirectPath}
              />
            </section>
          );
        }),
      )}
    </div>
  );
}
