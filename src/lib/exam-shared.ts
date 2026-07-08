// Deneme analizi: hem server hem client bileşenlerin kullandığı saf tipler ve
// yardımcılar. Bu dosya supabase/server'a bağımlı OLMAMALI (client bundle'a girer).

import type { Exam, ExamSubject } from "@/lib/types";

export interface ExamChartRow {
  examLabel: string;
  examDate: string;
  score: number | null;
  [subject: string]: string | number | null;
}

export interface ExamWithSubjects extends Exam {
  subjects: ExamSubject[];
  totalNet: number;
}

export interface ExamOverview {
  exams: ExamWithSubjects[];
  chartRows: ExamChartRow[];
  subjects: string[];
}

export interface KazanimStat {
  subject: string;
  code: string;
  name: string;
  correct: number;
  incorrect: number;
  blank: number;
  /** Bu kazanımdan şu ana kadar gelen toplam soru sayısı. */
  asked: number;
  /** Kaç farklı denemede soru geldi. */
  examCount: number;
  /** Doğruların, soru gelenlere oranı (0-100). */
  accuracy: number;
  /** Yanlışların, soru gelenlere oranı (0-100). */
  wrongRate: number;
}

export interface KazanimPriority extends KazanimStat {
  /** Son 10 deneme verisiyle hesaplanan çalışma önceliği puanı (yüksek = öncelikli). */
  priorityScore: number;
}

/** Deneme başına, ders bazında kazanım doğruluk yüzdesi (trend grafiği satırı). */
export interface KazanimTrendRow {
  examLabel: string;
  examDate: string;
  [subject: string]: string | number | null;
}

export interface KazanimAnalysis {
  /** Tüm denemelerdeki kazanım toplamları. */
  stats: KazanimStat[];
  /** Son 10 denemeye ve soru sıklığına göre çalışma önceliği listesi. */
  priorities: KazanimPriority[];
  /** Deneme sırasına göre ders bazında kazanım doğruluk gelişimi (0-100). */
  trend: KazanimTrendRow[];
  /** Trend grafiğinde çizilecek dersler (kazanım verisi olanlar). */
  trendSubjects: string[];
  examCount: number;
}

/** "Net" hesaplama: doğru - yanlış/4 (standart çoktan seçmeli netleştirme). */
export function calculateNet(correct: number, incorrect: number) {
  return Math.round((correct - incorrect / 4) * 100) / 100;
}
