// Çalışma günlüğü SAF mantığı (supabase importsuz → test edilebilir).
// Tarihler "YYYY-MM-DD" (Europe/Istanbul günü). Sıralama leksikografik = kronolojik.

const DAY_MS = 86_400_000;

function toYMD(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Bir güne n gün ekler/çıkarır (YYYY-MM-DD). */
export function addDays(ymd: string, n: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  return toYMD(new Date(d.getTime() + n * DAY_MS));
}

function isNextDay(a: string, b: string): boolean {
  return addDays(a, 1) === b;
}

export interface StudyLogLite {
  log_date: string;
  subject: string;
  minutes: number;
}

/**
 * Kayıt girilen ardışık günlerden seri hesaplar.
 * - `best`: en uzun ardışık gün dizisi.
 * - `current`: bugün ya da dün (bir gün tolerans) biten güncel seri; ikisi de
 *   yoksa 0 (seri kopmuş sayılır).
 */
export function computeStreak(
  dates: string[],
  today: string,
): { current: number; best: number } {
  const uniq = Array.from(new Set(dates)).sort();
  if (uniq.length === 0) return { current: 0, best: 0 };

  let best = 1;
  let run = 1;
  for (let i = 1; i < uniq.length; i++) {
    run = isNextDay(uniq[i - 1], uniq[i]) ? run + 1 : 1;
    if (run > best) best = run;
  }

  const last = uniq[uniq.length - 1];
  const yesterday = addDays(today, -1);
  let current = 0;
  if (last === today || last === yesterday) {
    current = 1;
    for (let i = uniq.length - 1; i > 0; i--) {
      if (isNextDay(uniq[i - 1], uniq[i])) current++;
      else break;
    }
  }

  return { current, best };
}

export interface WeekSummary {
  days: number;
  minutes: number;
  bySubject: { subject: string; minutes: number }[];
}

/** Bir haftanın (Pazartesi weekStart) çalışma özeti: gün sayısı, toplam dk, ders dökümü. */
export function summarizeWeek(logs: StudyLogLite[], weekStart: string): WeekSummary {
  const weekEnd = addDays(weekStart, 6);
  const inWeek = logs.filter((l) => l.log_date >= weekStart && l.log_date <= weekEnd);
  const days = new Set(inWeek.map((l) => l.log_date)).size;
  const minutes = inWeek.reduce((sum, l) => sum + l.minutes, 0);
  const bySubjectMap = new Map<string, number>();
  for (const l of inWeek) {
    bySubjectMap.set(l.subject, (bySubjectMap.get(l.subject) ?? 0) + l.minutes);
  }
  const bySubject = Array.from(bySubjectMap, ([subject, m]) => ({ subject, minutes: m })).sort(
    (a, b) => b.minutes - a.minutes,
  );
  return { days, minutes, bySubject };
}

export interface TopicBreakdownRow {
  subject: string;
  /** null = konu belirtilmemiş ("Genel çalışma"). */
  topic: string | null;
  minutes: number;
  questions: number;
  sessions: number;
}

export interface StudyLogTopicLite {
  subject: string;
  topic: string | null;
  minutes: number;
  question_count: number | null;
}

/**
 * Kayıtları ders + konu anahtarına göre toplar (SAF): toplam dakika, toplam soru
 * sayısı, kayıt (oturum) sayısı. Konu belirtilmemiş kayıtlar `topic: null` altında
 * tek grupta toplanır ("Genel çalışma"). Dakikaya göre azalan sıralanır.
 */
export function aggregateByTopic(logs: StudyLogTopicLite[]): TopicBreakdownRow[] {
  const map = new Map<string, TopicBreakdownRow>();
  for (const l of logs) {
    const key = `${l.subject}::${l.topic ?? ""}`;
    const row = map.get(key) ?? {
      subject: l.subject,
      topic: l.topic,
      minutes: 0,
      questions: 0,
      sessions: 0,
    };
    row.minutes += l.minutes;
    row.questions += l.question_count ?? 0;
    row.sessions += 1;
    map.set(key, row);
  }
  return Array.from(map.values()).sort((a, b) => b.minutes - a.minutes);
}
