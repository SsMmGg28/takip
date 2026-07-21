import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { AddScheduleEntryDialog } from "@/components/schedule/add-schedule-entry-dialog";
import { WeekSwitcher } from "@/components/schedule/week-switcher";
import { WeeklySchedule } from "@/components/schedule/weekly-schedule";
import { getBookSubjects, getBookUnits } from "@/lib/book-catalog";
import { LGS_SUBJECTS } from "@/lib/kazanim";
import { getStudentGrade } from "@/lib/students";
import { currentWeekStart, parseWeekParam } from "@/lib/week";
import type { StudyScheduleEntry } from "@/lib/types";

export const metadata = { title: "Çalışma Programı" };

export default async function StudentSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const profile = await requireRole(["student"]);
  const week = parseWeekParam((await searchParams).week);
  const supabase = await createClient();

  const [{ data: entries }, { data: weekRows }, grade] = await Promise.all([
    supabase
      .from("study_schedule_entries")
      .select("*")
      .eq("student_id", profile.id)
      .eq("week_start", week),
    supabase
      .from("study_schedule_entries")
      .select("week_start")
      .eq("student_id", profile.id)
      .lt("week_start", currentWeekStart())
      .order("week_start", { ascending: false }),
    getStudentGrade(profile.id),
  ]);
  const archiveWeeks = Array.from(
    new Set((weekRows ?? []).map((r) => r.week_start as string)),
  );
  const entryList = (entries as StudyScheduleEntry[]) ?? [];
  const isPast = week < currentWeekStart();
  const catalogSubjects = getBookSubjects(grade ?? 0);
  const subjects =
    catalogSubjects.length > 0
      ? catalogSubjects
      : LGS_SUBJECTS.map((subject) => subject.name);
  const kazanimlarBySubject = Object.fromEntries(
    subjects.map((subject) => [subject, getBookUnits(grade ?? 0, subject)]),
  );
  const redirectPath = `/student/schedule${
    week === currentWeekStart() ? "" : `?week=${week}`
  }`;

  return (
    <>
      <PageHeader
        title="Çalışma Programım"
        description="Ders ve kazanım seçerek programını düzenle; tamamladığın çalışmayı süreyle günlüğüne ekle."
        action={
          !isPast ? (
            <AddScheduleEntryDialog
              forCurrentStudent
              redirectPath={redirectPath}
              weekStart={week}
              entries={entryList}
              subjects={subjects}
              kazanimlarBySubject={kazanimlarBySubject}
            />
          ) : undefined
        }
      />
      <WeekSwitcher
        basePath="/student/schedule"
        weekStart={week}
        archiveWeeks={archiveWeeks}
      />
      <WeeklySchedule
        entries={entryList}
        redirectPath={redirectPath}
        readOnly={isPast}
        studentEditable={!isPast}
        subjects={subjects}
        kazanimlarBySubject={kazanimlarBySubject}
      />
    </>
  );
}
