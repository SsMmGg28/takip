import type {
  DailyGoalSummary,
  PriorityItem,
  TeacherRadarSignal,
} from "@/lib/dashboard-types";

export const ISTANBUL_TIME_ZONE = "Europe/Istanbul";

export function calculateDailyGoal(
  minutesGoal: number | null,
  questionsGoal: number | null,
  logs: Array<{ minutes: number; question_count: number | null }>,
): DailyGoalSummary {
  const minutesDone = logs.reduce((sum, row) => sum + Number(row.minutes || 0), 0);
  const questionsDone = logs.reduce(
    (sum, row) => sum + Number(row.question_count || 0),
    0,
  );
  return {
    minutesGoal,
    questionsGoal,
    minutesDone,
    questionsDone,
    completed:
      minutesGoal !== null &&
      questionsGoal !== null &&
      minutesDone >= minutesGoal &&
      questionsDone >= questionsGoal,
  };
}

function istanbulParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ISTANBUL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    minutes: Number(value("hour")) * 60 + Number(value("minute")),
  };
}

export function todayLabel(now = new Date()) {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: ISTANBUL_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);
}

export function greetingFor(now = new Date()) {
  const hour = Math.floor(istanbulParts(now).minutes / 60);
  if (hour < 6) return "İyi geceler";
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi günler";
  return "İyi akşamlar";
}

export interface StudentPriorityInput {
  schedules: Array<{
    id: string;
    title: string;
    date: string;
    start: string;
    end: string;
    completed?: boolean;
  }>;
  homework: Array<{ id: string; title: string; dueDate: string | null; href?: string }>;
  unreadAnnouncements: Array<{ id: string; title: string; href?: string }>;
  goal: DailyGoalSummary;
  nextItem?: { title: string; startsAt: string };
}

export function buildStudentPriorities(
  input: StudentPriorityInput,
  now = new Date(),
): PriorityItem[] {
  const clock = istanbulParts(now);
  const priorities: PriorityItem[] = [];
  for (const item of input.schedules.filter((entry) => !entry.completed)) {
    const start = Number(item.start.slice(0, 2)) * 60 + Number(item.start.slice(3, 5));
    const end = Number(item.end.slice(0, 2)) * 60 + Number(item.end.slice(3, 5));
    if (item.date === clock.date && start <= clock.minutes + 60 && end >= clock.minutes) {
      priorities.push({
        id: `schedule-${item.id}`,
        kind: "schedule",
        tone: "urgent",
        title: item.title,
        detail:
          clock.minutes >= start ? "Şu anda devam ediyor" : `${item.start}’te başlıyor`,
        href: "/student/schedule",
        startsAt: `${item.date}T${item.start}:00+03:00`,
        sortRank: 10,
      });
    }
  }
  for (const item of input.homework) {
    if (!item.dueDate) continue;
    const overdue = item.dueDate < clock.date;
    if (overdue || item.dueDate === clock.date) {
      priorities.push({
        id: `homework-${item.id}`,
        kind: "homework",
        tone: overdue ? "urgent" : "warning",
        title: item.title,
        detail: overdue ? "Teslim tarihi geçti" : "Bugün teslim",
        href: item.href ?? "/student/homework",
        sortRank: overdue ? 20 : 30,
      });
    }
  }
  for (const item of input.schedules.filter((entry) => !entry.completed)) {
    const start = Number(item.start.slice(0, 2)) * 60 + Number(item.start.slice(3, 5));
    if (item.date === clock.date && start > clock.minutes + 60) {
      priorities.push({
        id: `schedule-later-${item.id}`,
        kind: "schedule",
        tone: "info",
        title: item.title,
        detail: `Bugün ${item.start}`,
        href: "/student/schedule",
        sortRank: 40,
      });
    }
  }
  input.unreadAnnouncements.forEach((item) =>
    priorities.push({
      id: `announcement-${item.id}`,
      kind: "announcement",
      tone: "info",
      title: item.title,
      detail: "Okunmamış duyuru",
      href: item.href ?? "/student/announcements",
      sortRank: 50,
    }),
  );
  if (
    clock.minutes >= 18 * 60 &&
    input.goal.minutesGoal !== null &&
    input.goal.questionsGoal !== null &&
    !input.goal.completed
  ) {
    priorities.push({
      id: "daily-goal",
      kind: "goal",
      tone: "info",
      title: "Günlük hedefini tamamla",
      detail: `${input.goal.minutesDone}/${input.goal.minutesGoal} dk · ${input.goal.questionsDone}/${input.goal.questionsGoal} soru`,
      href: "/student/gunluk",
      sortRank: 60,
    });
  }
  if (!priorities.length) {
    priorities.push({
      id: "all-clear",
      kind: "success",
      tone: "success",
      title: "Bugünün öncelikleri tamam",
      detail: input.nextItem
        ? `Sırada ${input.nextItem.title} var.`
        : "Kendine ayırdığın zamanın keyfini çıkar.",
      startsAt: input.nextItem?.startsAt,
      sortRank: 999,
    });
  }
  return priorities.sort((a, b) => a.sortRank - b.sortRank);
}

export function buildTeacherRadar(
  input: Array<{
    studentId: string;
    studentName: string;
    overdueHomework: number;
    missingChecksLast14Days: number;
    hasActiveResponsibility: boolean;
    daysSinceStudyLog: number | null;
    latestNet: number | null;
    previousNet: number | null;
  }>,
): TeacherRadarSignal[] {
  return input.flatMap((student) => {
    const signals: TeacherRadarSignal[] = [];
    const base = {
      studentId: student.studentId,
      studentName: student.studentName,
      href: `/teacher/students/${student.studentId}`,
    };
    if (student.overdueHomework >= 1)
      signals.push({
        ...base,
        id: `${student.studentId}-overdue`,
        reason: "overdue_homework",
        explanation: `${student.overdueHomework} gecikmiş ödev bulunuyor.`,
      });
    if (student.missingChecksLast14Days >= 2)
      signals.push({
        ...base,
        id: `${student.studentId}-checks`,
        reason: "missing_checks",
        explanation: "Son 14 günde en az iki eksik kontrol var.",
      });
    if (
      student.hasActiveResponsibility &&
      (student.daysSinceStudyLog === null || student.daysSinceStudyLog >= 7)
    )
      signals.push({
        ...base,
        id: `${student.studentId}-study`,
        reason: "inactive_study",
        explanation: "Aktif sorumluluğu varken 7 gündür çalışma kaydı yok.",
      });
    if (
      student.latestNet !== null &&
      student.previousNet !== null &&
      student.previousNet - student.latestNet >= 5
    )
      signals.push({
        ...base,
        id: `${student.studentId}-net`,
        reason: "net_drop",
        explanation: `Son denemede ${Math.round((student.previousNet - student.latestNet) * 100) / 100} net düşüş var.`,
      });
    return signals;
  });
}
