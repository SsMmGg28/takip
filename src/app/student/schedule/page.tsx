import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { WeekSwitcher } from "@/components/schedule/week-switcher";
import { WeeklySchedule } from "@/components/schedule/weekly-schedule";
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

  const [{ data: entries }, { data: weekRows }] = await Promise.all([
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
  ]);
  const archiveWeeks = Array.from(
    new Set((weekRows ?? []).map((r) => r.week_start as string)),
  );

  return (
    <>
      <PageHeader
        title="Çalışma Programım"
        description="Öğretmenin ve velinin senin için hazırladığı haftalık program; geçmiş haftaları arşivden inceleyebilirsin."
      />
      <WeekSwitcher
        basePath="/student/schedule"
        weekStart={week}
        archiveWeeks={archiveWeeks}
      />
      <WeeklySchedule
        entries={(entries as StudyScheduleEntry[]) ?? []}
        redirectPath="/student/schedule"
        readOnly
      />
    </>
  );
}
