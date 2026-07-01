import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddScheduleEntryDialog } from "@/components/schedule/add-schedule-entry-dialog";
import { WeeklySchedule } from "@/components/schedule/weekly-schedule";
import type { StudySchedureEntry } from "@/lib/types";

export default async function TeacherStudentSchedulePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", studentId)
    .single();

  if (!student) notFound();

  const { data: entries } = await supabase
    .from("study_schedule_entries")
    .select("*")
    .eq("student_id", studentId);

  const redirectPath = `/teacher/schedule/${studentId}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold sm:text-xl">
          {student.full_name} — Çalışma Programı
        </h1>
        <AddScheduleEntryDialog studentId={studentId} redirectPath={redirectPath} />
      </div>
      <WeeklySchedule
        entries={(entries as StudySchedureEntry[]) ?? []}
        redirectPath={redirectPath}
      />
    </div>
  );
}
