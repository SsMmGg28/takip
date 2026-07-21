import type { HomeworkStatus, Role } from "@/lib/types";

export type PriorityTone = "urgent" | "warning" | "info" | "success";
export type PriorityKind =
  "schedule" | "homework" | "announcement" | "goal" | "approval" | "report" | "success";

export interface PriorityItem {
  id: string;
  kind: PriorityKind;
  tone: PriorityTone;
  title: string;
  detail: string;
  href?: string;
  studentName?: string;
  startsAt?: string;
  sortRank: number;
}

export interface DailyGoalSummary {
  minutesGoal: number | null;
  questionsGoal: number | null;
  minutesDone: number;
  questionsDone: number;
  completed: boolean;
}

export interface HomeworkItem {
  id: string;
  title: string;
  dueDate: string | null;
  status: HomeworkStatus;
  studentName?: string;
  studentMarkedDone?: boolean;
  checkedAt?: string | null;
  feedback?: string | null;
  tests?: Array<{
    sectionId: string;
    sectionName: string;
    testNumber: number;
    studentMarked: boolean;
    completed: boolean;
  }>;
}

export interface ScheduleItem {
  id: string;
  studentId?: string;
  day: number;
  start: string;
  end: string;
  label: string;
  subject?: string | null;
  studentName?: string;
  completedAt?: string | null;
  canUndo?: boolean;
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  type: "lesson" | "reminder" | "homework_deadline";
}

export interface ExamItem {
  id: string;
  name: string;
  date: string;
  totalNet: number;
  score: number | null;
  studentName?: string;
}

export interface PendingBookItem {
  id: string;
  name: string;
  subject: string | null;
}

export interface WeeklySummaryChild {
  studentId: string;
  studentName: string;
  completedHomework: number;
  incompleteHomework: number;
  testsSolved: number;
  netChange: number | null;
  studyDays: number;
  goal: DailyGoalSummary;
}

export type RadarReason =
  "overdue_homework" | "missing_checks" | "inactive_study" | "net_drop";

export interface TeacherRadarSignal {
  id: string;
  studentId: string;
  studentName: string;
  reason: RadarReason;
  explanation: string;
  href: string;
}

export interface ParentChildContext {
  id: string;
  name: string;
  grade: number | null;
  urgentCount: number;
  goal: DailyGoalSummary;
}

export const DASHBOARD_SECTION_IDS = {
  student: ["today-flow", "homework-plan", "progress", "pomodoro", "countdown"],
  teacher: ["action-queue", "quick-create", "student-radar", "today-calendar"],
  parent: ["weekly-story", "upcoming", "academic-progress"],
} as const satisfies Record<Role, readonly string[]>;

export type StudentSectionId = (typeof DASHBOARD_SECTION_IDS.student)[number];
export type TeacherSectionId = (typeof DASHBOARD_SECTION_IDS.teacher)[number];
export type ParentSectionId = (typeof DASHBOARD_SECTION_IDS.parent)[number];
export type DashboardSectionId = StudentSectionId | TeacherSectionId | ParentSectionId;

export interface DashboardSectionLayout {
  id: DashboardSectionId;
  collapsed: boolean;
}

export interface StoredLayoutV2 {
  version: 2;
  sections: DashboardSectionLayout[];
  hidden: DashboardSectionId[];
  selectedStudentId?: string;
}

/** Eski kayıtları okuyup sıfırlayabilmek için gevşek disk sözleşmesi. */
export type StoredLayout = StoredLayoutV2 | { version: number; [key: string]: unknown };

interface DashboardBase {
  firstName: string;
  todayLabel: string;
  priorities: PriorityItem[];
}

export interface StudentDashboardData extends DashboardBase {
  role: "student";
  homework: HomeworkItem[];
  todaySchedule: ScheduleItem[];
  upcomingEvents: EventItem[];
  recentExams: ExamItem[];
  goal: DailyGoalSummary;
  studyStreak: { current: number; best: number; weekDays: number };
}

export interface TeacherDashboardData extends DashboardBase {
  role: "teacher";
  students: Array<{ id: string; name: string; grade: number | null }>;
  actionHomework: HomeworkItem[];
  pendingBooks: PendingBookItem[];
  events: EventItem[];
  radar: TeacherRadarSignal[];
  studentGoals: Array<{ studentId: string; studentName: string; goal: DailyGoalSummary }>;
  homeworkBooks: Array<{
    id: string;
    name: string;
    subject: string | null;
    grade: number | null;
    sections: Array<{ id: string; name: string; testCount: number }>;
  }>;
}

export interface ParentDashboardData extends DashboardBase {
  role: "parent";
  selectedStudentId: string | null;
  children: ParentChildContext[];
  selectedHomework: HomeworkItem[];
  selectedSchedule: ScheduleItem[];
  selectedExams: ExamItem[];
  weeklyStory: WeeklySummaryChild[];
  upcomingEvents: EventItem[];
}

export type DashboardData =
  StudentDashboardData | TeacherDashboardData | ParentDashboardData;
