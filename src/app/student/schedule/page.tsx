import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AddScheduleEntryDialog } from "@/components/schedule/add-schedule-entry-dialog";
import { WeeklySchedule } from "@/components/schedule/weekly-schedule";
import type { StudyScheduleEntry } from "@/lib/types";

export default async function StudentSchedulePage() {
  const profile = await requireRole(["student"]);
  const supabase = await createClient();

  const { data: entries } = await supabase
    .from("study_schedule_entries")
    .select("*")
    .eq("student_id", profile.id);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Çalışma Programım</h1>
        <AddScheduleEntryDialog studentId={profile.id} redirectPath="/student/schedule" />
      </div>
      <WeeklySchedule
        entries={(entries as StudyScheduleEntry[]) ?? []}
        redirectPath="/student/schedule"
      />
    </div>
  );
}
