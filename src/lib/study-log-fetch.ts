import { createClient } from "@/lib/supabase/server";
import { computeStreak, summarizeWeek, type WeekSummary } from "@/lib/study-log";
import { currentWeekStart, todayInIstanbul } from "@/lib/week";
import type { StudyLog } from "@/lib/types";

export interface StudyStreakSummary {
  current: number;
  best: number;
  todayMinutes: number;
  week: WeekSummary;
  recent: StudyLog[];
}

/**
 * Bir öğrencinin çalışma günlüğü özeti: seri (streak), bugünkü dakika, bu haftanın
 * dökümü ve son kayıtlar. Öğrenci/öğretmen/veli (RLS ile) çağırabilir.
 */
export async function getStudentStudySummary(studentId: string): Promise<StudyStreakSummary> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("study_log")
    .select("*")
    .eq("student_id", studentId)
    .order("log_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(400);

  const logs = (data as StudyLog[]) ?? [];
  const today = todayInIstanbul();
  const { current, best } = computeStreak(
    logs.map((l) => l.log_date),
    today,
  );
  const week = summarizeWeek(logs, currentWeekStart());
  const todayMinutes = logs
    .filter((l) => l.log_date === today)
    .reduce((sum, l) => sum + l.minutes, 0);

  return { current, best, todayMinutes, week, recent: logs.slice(0, 20) };
}
