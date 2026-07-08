import { requireRole } from "@/lib/auth";
import { getAccessibleStudents } from "@/lib/students";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { AddScheduleEntryDialog } from "@/components/schedule/add-schedule-entry-dialog";
import { CopyWeekButton } from "@/components/schedule/schedule-toolbar-buttons";
import { WeekSwitcher } from "@/components/schedule/week-switcher";
import { WeeklySchedule } from "@/components/schedule/weekly-schedule";
import { currentWeekStart, parseWeekParam } from "@/lib/week";
import type { StudyScheduleEntry } from "@/lib/types";

export default async function ParentSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const profile = await requireRole(["parent"]);
  const week = parseWeekParam((await searchParams).week);
  const students = await getAccessibleStudents(profile);
  const supabase = await createClient();

  if (students.length === 0) {
    return (
      <>
        <PageHeader title="Çalışma Programı" />
        <EmptyState title="Eşleştirilmiş öğrenci bulunamadı" />
      </>
    );
  }

  const isPast = week < currentWeekStart();
  const redirectPath = `/parent/schedule${
    week === currentWeekStart() ? "" : `?week=${week}`
  }`;

  const perStudent = await Promise.all(
    students.map(async (student) => {
      const [{ data: entries }, { data: weekRows }] = await Promise.all([
        supabase
          .from("study_schedule_entries")
          .select("*")
          .eq("student_id", student.id)
          .eq("week_start", week),
        supabase
          .from("study_schedule_entries")
          .select("week_start")
          .eq("student_id", student.id)
          .lt("week_start", currentWeekStart()),
      ]);
      return {
        student,
        entries: (entries as StudyScheduleEntry[]) ?? [],
        weeks: (weekRows ?? []).map((r) => r.week_start as string),
      };
    }),
  );

  const archiveWeeks = Array.from(new Set(perStudent.flatMap((s) => s.weeks))).sort(
    (a, b) => b.localeCompare(a),
  );

  return (
    <>
      <PageHeader
        title="Çalışma Programı"
        description="Haftalık programı düzenleyebilir, geçmiş haftaları arşivden görüp tek tıkla geri getirebilirsin."
      />

      <WeekSwitcher
        basePath="/parent/schedule"
        weekStart={week}
        archiveWeeks={archiveWeeks}
      />

      <div className="flex flex-col gap-8">
        {perStudent.map(({ student, entries }) => (
          <section key={student.id} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {students.length > 1 ? (
                <h2 className="font-medium text-muted-foreground">{student.full_name}</h2>
              ) : (
                <span />
              )}
              {isPast ? (
                entries.length > 0 && (
                  <CopyWeekButton studentId={student.id} fromWeek={week} />
                )
              ) : (
                <AddScheduleEntryDialog
                  studentId={student.id}
                  redirectPath={redirectPath}
                  weekStart={week}
                  entries={entries}
                />
              )}
            </div>
            <WeeklySchedule
              entries={entries}
              redirectPath={redirectPath}
              readOnly={isPast}
            />
          </section>
        ))}
      </div>
    </>
  );
}
