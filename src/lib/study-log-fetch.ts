import { createClient } from "@/lib/supabase/server";
import {
  aggregateByTopic,
  computeStreak,
  summarizeWeek,
  type TopicBreakdownRow,
  type WeekSummary,
} from "@/lib/study-log";
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

/**
 * Bir öğrencinin TÜM zamanlar ders×konu dökümü: her (ders, konu) kombinasyonu için
 * toplam dakika, toplam soru sayısı ve oturum sayısı. Öğrenci/öğretmen/veli (RLS)
 * çağırabilir.
 */
export async function getStudyBreakdown(studentId: string): Promise<TopicBreakdownRow[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("study_log")
    .select("subject, topic, minutes, question_count")
    .eq("student_id", studentId)
    .limit(2000);

  return aggregateByTopic(
    (data as { subject: string; topic: string | null; minutes: number; question_count: number | null }[]) ?? [],
  );
}
