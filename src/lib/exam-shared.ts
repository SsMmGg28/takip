// Deneme analizi: hem server hem client bileşenlerin kullandığı saf tipler ve
// yardımcılar. Bu dosya supabase/server'a bağımlı OLMAMALI (client bundle'a girer).

import type { Exam, ExamKazanimResult, ExamSubject } from "@/lib/types";

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

/** Kazanım satırı + hangi ders/denemeye ait olduğu bağlamı. */
export interface KazanimRowWithContext extends ExamKazanimResult {
  subjectName: string;
  examId: string;
}

/**
 * Kazanım satırlarını `ders::kod` anahtarına göre toplar (SAF): doğru/yanlış/boş
 * toplamları, soru sayısı, kaç farklı denemede geldiği (examCount), doğruluk
 * (accuracy) ve yanlış oranı (wrongRate, 0-100). Hem tüm-zaman analizinde hem de
 * tarih aralıklı raporda kullanılır.
 */
export function aggregateKazanim(rows: KazanimRowWithContext[]): KazanimStat[] {
  const totals = new Map<string, KazanimStat>();
  const examIdsByKey = new Map<string, Set<string>>();
  for (const row of rows) {
    const key = `${row.subjectName}::${row.kazanim_code}`;
    const entry =
      totals.get(key) ??
      ({
        subject: row.subjectName,
        code: row.kazanim_code,
        name: row.kazanim_name,
        correct: 0,
        incorrect: 0,
        blank: 0,
        asked: 0,
        examCount: 0,
        accuracy: 0,
        wrongRate: 0,
      } satisfies KazanimStat);
    entry.correct += row.correct_count;
    entry.incorrect += row.incorrect_count;
    entry.blank += row.blank_count;
    entry.asked += row.correct_count + row.incorrect_count + row.blank_count;
    totals.set(key, entry);

    const examIds = examIdsByKey.get(key) ?? new Set<string>();
    examIds.add(row.examId);
    examIdsByKey.set(key, examIds);
  }
  for (const [key, entry] of totals) {
    entry.examCount = examIdsByKey.get(key)?.size ?? 0;
    entry.accuracy = entry.asked === 0 ? 0 : Math.round((entry.correct / entry.asked) * 100);
    entry.wrongRate = entry.asked === 0 ? 0 : Math.round((entry.incorrect / entry.asked) * 100);
  }
  return Array.from(totals.values());
}
