import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { AddScheduleEntryDialog } from "@/components/schedule/add-schedule-entry-dialog";
import {
  AutoRepeatToggle,
  CopyWeekButton,
  NotifyScheduleButton,
} from "@/components/schedule/schedule-toolbar-buttons";
import { WeekSwitcher } from "@/components/schedule/week-switcher";
import { WeeklySchedule } from "@/components/schedule/weekly-schedule";
import { currentWeekStart, parseWeekParam } from "@/lib/week";
import type { StudyScheduleEntry } from "@/lib/types";

export const metadata = { title: "Çalışma Programı" };

export default async function TeacherStudentSchedulePage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ week?: string }>;
}) {
  await requireRole(["teacher"]);
  const { studentId } = await params;
  const week = parseWeekParam((await searchParams).week);
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", studentId)
    .single();
  if (!student) notFound();

  const [{ data: entries }, { data: weekRows }, { data: studentProfile }] =
    await Promise.all([
      supabase
        .from("study_schedule_entries")
        .select("*")
        .eq("student_id", studentId)
        .eq("week_start", week),
      supabase
        .from("study_schedule_entries")
        .select("week_start")
        .eq("student_id", studentId)
        .lt("week_start", currentWeekStart())
        .order("week_start", { ascending: false }),
      supabase
        .from("student_profiles")
        .select("schedule_auto_repeat")
        .eq("id", studentId)
        .single(),
    ]);

  const entryList = (entries as StudyScheduleEntry[]) ?? [];
  const archiveWeeks = Array.from(
    new Set((weekRows ?? []).map((r) => r.week_start as string)),
  );
  const isPast = week < currentWeekStart();
  const redirectPath = `/teacher/schedule/${studentId}${
    week === currentWeekStart() ? "" : `?week=${week}`
  }`;

  return (
    <>
      <PageHeader
        title={`${student.full_name} — Çalışma Programı`}
        description="Öğrencinin mevcut programı aşağıda; çakışmaları görerek ekleme yap, program bitince öğrenci ve veliye bildir."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/teacher/schedule"
              className="text-sm text-muted-foreground hover:underline"
            >
              ← Öğrenciler
            </Link>
            {isPast ? (
              <CopyWeekButton studentId={studentId} fromWeek={week} />
            ) : (
              <>
                {entryList.length > 0 && (
                  <NotifyScheduleButton studentId={studentId} weekStart={week} />
                )}
                <AddScheduleEntryDialog
                  studentId={studentId}
                  redirectPath={redirectPath}
                  weekStart={week}
                  entries={entryList}
                />
              </>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <WeekSwitcher
          basePath={`/teacher/schedule/${studentId}`}
          weekStart={week}
          archiveWeeks={archiveWeeks}
        />
        <AutoRepeatToggle
          studentId={studentId}
          initialEnabled={Boolean(studentProfile?.schedule_auto_repeat)}
        />
      </div>

      <WeeklySchedule entries={entryList} redirectPath={redirectPath} readOnly={isPast} />
    </>
  );
}
