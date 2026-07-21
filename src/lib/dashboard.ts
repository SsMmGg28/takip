import { createClient } from "@/lib/supabase/server";
import { getApprovedBooks, getPendingBooks } from "@/lib/books";
import { getStudentCalendarItems } from "@/lib/calendar";
import { normalizeDashboardLayout } from "@/lib/dashboard-layout";
import {
  buildStudentPriorities,
  buildTeacherRadar,
  calculateDailyGoal,
  greetingFor,
  todayLabel,
} from "@/lib/dashboard-priority";
import { calculateNet } from "@/lib/exam-shared";
import { effectiveHomeworkStatus } from "@/lib/homework";
import { getAccessibleStudentsWithGrades } from "@/lib/students";
import { getStudentStudySummary } from "@/lib/study-log-fetch";
import { currentWeekStart, todayInIstanbul } from "@/lib/week";
import type {
  DashboardData,
  EventItem,
  ExamItem,
  HomeworkItem,
  ParentDashboardData,
  PriorityItem,
  ScheduleItem,
  StoredLayout,
  StoredLayoutV2,
  WeeklySummaryChild,
} from "@/lib/dashboard-types";
import type {
  Exam,
  ExamSubject,
  Homework,
  HomeworkTest,
  Profile,
  StudyScheduleEntry,
} from "@/lib/types";

type HomeworkRow = Homework & {
  homework_tests?: Array<
    HomeworkTest & {
      resource_book_sections?: { name: string } | null;
    }
  >;
};

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

function shortTime(time: string) {
  return time.slice(0, 5);
}

function todayDayIndex() {
  const date = new Date(`${todayInIstanbul()}T00:00:00Z`);
  return (date.getUTCDay() + 6) % 7;
}

function istanbulDate(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function dateForScheduleDay(day: number) {
  const start = new Date(`${currentWeekStart()}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() + day);
  return start.toISOString().slice(0, 10);
}

function mapHomework(row: HomeworkRow, studentName?: string): HomeworkItem {
  return {
    id: row.id,
    title: row.title,
    dueDate: row.due_date,
    status: effectiveHomeworkStatus(row),
    studentName,
    studentMarkedDone: Boolean(row.student_marked_done_at),
    checkedAt: row.checked_at,
    feedback: row.feedback,
    tests: (row.homework_tests ?? []).map((test) => ({
      sectionId: test.section_id,
      sectionName: test.resource_book_sections?.name ?? "Testler",
      testNumber: test.test_number,
      studentMarked: test.student_marked,
      completed: test.completed,
    })),
  };
}

function mapSchedule(row: StudyScheduleEntry, studentName?: string): ScheduleItem {
  return {
    id: row.id,
    studentId: row.student_id,
    day: row.day_of_week,
    start: shortTime(row.start_time),
    end: shortTime(row.end_time),
    label: row.activity_label,
    subject: row.subject,
    studentName,
    completedAt: row.completed_at,
    canUndo: Boolean(
      row.completed_at && istanbulDate(row.completed_at) === todayInIstanbul(),
    ),
  };
}

function mapExam(row: Exam & { exam_subjects?: ExamSubject[] }, studentName?: string) {
  const totalNet = (row.exam_subjects ?? []).reduce(
    (sum, subject) => sum + calculateNet(subject.correct_count, subject.incorrect_count),
    0,
  );
  return {
    id: row.id,
    name: row.exam_name,
    date: row.exam_date,
    totalNet: Math.round(totalNet * 100) / 100,
    score: row.score,
    studentName,
  } satisfies ExamItem;
}

function upcomingOnly(events: EventItem[], limit = 10) {
  const today = todayInIstanbul();
  return events
    .filter((event) => event.date.slice(0, 10) >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}

async function unreadAnnouncements() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, title, link")
    .eq("type", "announcement_created")
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(5);
  return data ?? [];
}

async function studentGoal(studentId: string) {
  const supabase = await createClient();
  const [{ data: profile }, { data: logs }] = await Promise.all([
    supabase
      .from("student_profiles")
      .select("daily_goal_minutes, daily_goal_questions")
      .eq("id", studentId)
      .single(),
    supabase
      .from("study_log")
      .select("minutes, question_count")
      .eq("student_id", studentId)
      .eq("log_date", todayInIstanbul()),
  ]);
  return calculateDailyGoal(
    profile?.daily_goal_minutes ?? null,
    profile?.daily_goal_questions ?? null,
    logs ?? [],
  );
}

async function getStudentData(profile: Profile): Promise<DashboardData> {
  const supabase = await createClient();
  const [
    homeworkResult,
    scheduleResult,
    calendar,
    examsResult,
    goal,
    study,
    announcements,
  ] = await Promise.all([
    supabase
      .from("homework")
      .select("*, homework_tests(*, resource_book_sections(name))")
      .eq("student_id", profile.id)
      .in("status", ["assigned", "incomplete", "overdue"])
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(12),
    supabase
      .from("study_schedule_entries")
      .select("*")
      .eq("student_id", profile.id)
      .eq("week_start", currentWeekStart())
      .order("day_of_week")
      .order("start_time"),
    getStudentCalendarItems(profile.id),
    supabase
      .from("exams")
      .select("*, exam_subjects(*)")
      .eq("student_id", profile.id)
      .order("exam_date", { ascending: false })
      .limit(4),
    studentGoal(profile.id),
    getStudentStudySummary(profile.id),
    unreadAnnouncements(),
  ]);

  const homework = ((homeworkResult.data as HomeworkRow[] | null) ?? []).map((row) =>
    mapHomework(row),
  );
  const schedule = ((scheduleResult.data as StudyScheduleEntry[] | null) ?? []).map(
    (row) => mapSchedule(row),
  );
  const todaySchedule = schedule.filter((item) => item.day === todayDayIndex());
  const upcomingEvents = upcomingOnly(
    calendar.map((item) => ({
      id: item.id,
      title: item.title,
      date: item.date,
      type: item.type,
    })),
  );
  const nextSchedule = schedule.find((item) => {
    const date = dateForScheduleDay(item.day);
    return date > todayInIstanbul() || (date === todayInIstanbul() && !item.completedAt);
  });
  const priorities = buildStudentPriorities({
    schedules: schedule.map((item) => ({
      id: item.id,
      title: item.label,
      date: dateForScheduleDay(item.day),
      start: item.start,
      end: item.end,
      completed: Boolean(item.completedAt),
    })),
    homework: homework.map((item) => ({
      id: item.id,
      title: item.title,
      dueDate: item.dueDate,
    })),
    unreadAnnouncements: announcements.map((item) => ({
      id: item.id,
      title: item.title,
      href: item.link ?? undefined,
    })),
    goal,
    nextItem: nextSchedule
      ? {
          title: nextSchedule.label,
          startsAt: `${dateForScheduleDay(nextSchedule.day)}T${nextSchedule.start}:00+03:00`,
        }
      : undefined,
  });

  return {
    role: "student",
    firstName: firstName(profile.full_name),
    todayLabel: todayLabel(),
    priorities,
    homework,
    todaySchedule,
    upcomingEvents,
    recentExams: (
      (examsResult.data as (Exam & { exam_subjects: ExamSubject[] })[] | null) ?? []
    ).map((row) => mapExam(row)),
    goal,
    studyStreak: {
      current: study?.current ?? 0,
      best: study?.best ?? 0,
      weekDays: study?.week.days ?? 0,
    },
  };
}

async function getTeacherData(profile: Profile): Promise<DashboardData> {
  const supabase = await createClient();
  const students = await getAccessibleStudentsWithGrades(profile);
  const ids = students.map((student) => student.id);
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86_400_000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
  const [
    homeworkResult,
    scheduleResult,
    studyResult,
    examsResult,
    eventsResult,
    pendingBooks,
    books,
    goalsResult,
    logsTodayResult,
  ] = await Promise.all([
    ids.length
      ? supabase
          .from("homework")
          .select("*, homework_tests(*, resource_book_sections(name))")
          .in("student_id", ids)
          .in("status", ["assigned", "incomplete", "overdue"])
          .order("due_date", { ascending: true, nullsFirst: false })
      : Promise.resolve({ data: [] }),
    ids.length
      ? supabase
          .from("study_schedule_entries")
          .select("student_id, completed_at")
          .in("student_id", ids)
          .eq("week_start", currentWeekStart())
      : Promise.resolve({ data: [] }),
    ids.length
      ? supabase
          .from("study_log")
          .select("student_id, log_date")
          .in("student_id", ids)
          .gte("log_date", sevenDaysAgo)
      : Promise.resolve({ data: [] }),
    ids.length
      ? supabase
          .from("exams")
          .select("*, exam_subjects(*)")
          .in("student_id", ids)
          .order("exam_date", { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase
      .from("calendar_events")
      .select("id, title, start_at, type")
      .gte("start_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
      .order("start_at")
      .limit(10),
    getPendingBooks(),
    getApprovedBooks(),
    ids.length
      ? supabase
          .from("student_profiles")
          .select("id, daily_goal_minutes, daily_goal_questions")
          .in("id", ids)
      : Promise.resolve({ data: [] }),
    ids.length
      ? supabase
          .from("study_log")
          .select("student_id, minutes, question_count")
          .in("student_id", ids)
          .eq("log_date", todayInIstanbul())
      : Promise.resolve({ data: [] }),
  ]);

  const nameById = new Map(
    students.map((student) => [student.id, firstName(student.full_name)]),
  );
  const homeworkRows = (homeworkResult.data as HomeworkRow[] | null) ?? [];
  const actionHomework = homeworkRows.map((row) =>
    mapHomework(row, nameById.get(row.student_id)),
  );
  const schedules = (scheduleResult.data ?? []) as Array<{
    student_id: string;
    completed_at: string | null;
  }>;
  const studyRows = (studyResult.data ?? []) as Array<{
    student_id: string;
    log_date: string;
  }>;
  const examRows =
    (examsResult.data as (Exam & { exam_subjects: ExamSubject[] })[] | null) ?? [];
  const examsByStudent = new Map<string, ExamItem[]>();
  for (const row of examRows) {
    const list = examsByStudent.get(row.student_id) ?? [];
    if (list.length < 2) list.push(mapExam(row));
    examsByStudent.set(row.student_id, list);
  }
  const radar = buildTeacherRadar(
    students.map((student) => {
      const ownHomework = homeworkRows.filter((row) => row.student_id === student.id);
      const latestLog = studyRows
        .filter((row) => row.student_id === student.id)
        .map((row) => row.log_date)
        .sort()
        .at(-1);
      const exams = examsByStudent.get(student.id) ?? [];
      return {
        studentId: student.id,
        studentName: firstName(student.full_name),
        overdueHomework: ownHomework.filter(
          (row) => effectiveHomeworkStatus(row) === "overdue",
        ).length,
        missingChecksLast14Days: ownHomework.filter(
          (row) =>
            row.status === "incomplete" &&
            row.checked_at &&
            row.checked_at >= fourteenDaysAgo,
        ).length,
        hasActiveResponsibility:
          ownHomework.length > 0 ||
          schedules.some((row) => row.student_id === student.id && !row.completed_at),
        daysSinceStudyLog: latestLog
          ? Math.floor(
              (Date.now() - new Date(`${latestLog}T00:00:00+03:00`).getTime()) /
                86_400_000,
            )
          : null,
        latestNet: exams[0]?.totalNet ?? null,
        previousNet: exams[1]?.totalNet ?? null,
      };
    }),
  );
  const events = upcomingOnly(
    (eventsResult.data ?? []).map((event) => ({
      id: event.id,
      title: event.title,
      date: event.start_at,
      type: event.type as EventItem["type"],
    })),
  );
  const goalById = new Map((goalsResult.data ?? []).map((row) => [row.id, row]));
  const logsToday = (logsTodayResult.data ?? []) as Array<{
    student_id: string;
    minutes: number;
    question_count: number | null;
  }>;
  const studentGoals = students.map((student) => {
    const raw = goalById.get(student.id);
    return {
      studentId: student.id,
      studentName: firstName(student.full_name),
      goal: calculateDailyGoal(
        raw?.daily_goal_minutes ?? null,
        raw?.daily_goal_questions ?? null,
        logsToday.filter((row) => row.student_id === student.id),
      ),
    };
  });
  const priorities: PriorityItem[] = [
    ...events.slice(0, 2).map((event, index) => ({
      id: `event-${event.id}`,
      kind: "schedule" as const,
      tone: "warning" as const,
      title: event.title,
      detail: new Intl.DateTimeFormat("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Istanbul",
      }).format(new Date(event.date)),
      href: "/teacher/calendar",
      startsAt: event.date,
      sortRank: 10 + index,
    })),
    ...actionHomework
      .filter((item) => !item.checkedAt)
      .slice(0, 4)
      .map((item, index) => ({
        id: `check-${item.id}`,
        kind: "homework" as const,
        tone: "warning" as const,
        title: `${item.studentName ?? "Öğrenci"}: ${item.title}`,
        detail: "Kontrol bekliyor",
        href: "/teacher/homework",
        sortRank: 20 + index,
      })),
    ...pendingBooks.slice(0, 3).map((book, index) => ({
      id: `book-${book.id}`,
      kind: "approval" as const,
      tone: "info" as const,
      title: book.name,
      detail: "Kitap onayı bekliyor",
      href: "/teacher/resources",
      sortRank: 40 + index,
    })),
  ];
  if (!priorities.length)
    priorities.push({
      id: "all-clear",
      kind: "success",
      tone: "success",
      title: "İşlem kuyruğu temiz",
      detail: "Bugün için bekleyen kritik işlem yok.",
      sortRank: 999,
    });

  return {
    role: "teacher",
    firstName: firstName(profile.full_name),
    todayLabel: todayLabel(),
    priorities,
    students: students.map((student) => ({
      id: student.id,
      name: student.full_name,
      grade: student.grade_level,
    })),
    actionHomework,
    pendingBooks: pendingBooks.map((book) => ({
      id: book.id,
      name: book.name,
      subject: book.subject,
    })),
    events,
    radar,
    studentGoals,
    homeworkBooks: books.map((book) => ({
      id: book.id,
      name: book.name,
      subject: book.subject,
      grade: book.grade_level,
      sections: book.sections.map((section) => ({
        id: section.id,
        name: section.name,
        testCount: section.test_count,
      })),
    })),
  };
}

function groupByStudent<T extends { student_id: string }>(rows: T[]) {
  const map = new Map<string, T[]>();
  for (const row of rows)
    map.set(row.student_id, [...(map.get(row.student_id) ?? []), row]);
  return map;
}

async function getParentData(
  profile: Profile,
  storedLayout: StoredLayout | null,
): Promise<ParentDashboardData> {
  const supabase = await createClient();
  const children = await getAccessibleStudentsWithGrades(profile);
  const ids = children.map((child) => child.id);
  const layout = normalizeDashboardLayout("parent", storedLayout, ids);
  const selectedStudentId = layout.selectedStudentId ?? ids[0] ?? null;
  if (!ids.length)
    return {
      role: "parent",
      firstName: firstName(profile.full_name),
      todayLabel: todayLabel(),
      priorities: [
        {
          id: "no-child",
          kind: "success",
          tone: "success",
          title: "Bağlı öğrenci yok",
          detail: "Bir öğrenci bağlandığında özet burada görünecek.",
          sortRank: 999,
        },
      ],
      selectedStudentId: null,
      children: [],
      selectedHomework: [],
      selectedSchedule: [],
      selectedExams: [],
      weeklyStory: [],
      upcomingEvents: [],
    };
  const weekStart = currentWeekStart();
  const [
    homeworkResult,
    scheduleResult,
    examsResult,
    studyResult,
    testsResult,
    profilesResult,
    logsTodayResult,
    announcements,
    calendar,
  ] = await Promise.all([
    supabase
      .from("homework")
      .select("*")
      .in("student_id", ids)
      .in("status", ["assigned", "completed", "incomplete", "overdue"]),
    supabase
      .from("study_schedule_entries")
      .select("*")
      .in("student_id", ids)
      .eq("week_start", weekStart)
      .order("day_of_week")
      .order("start_time"),
    supabase
      .from("exams")
      .select("*, exam_subjects(*)")
      .in("student_id", ids)
      .order("exam_date", { ascending: false }),
    supabase
      .from("study_log")
      .select("student_id, log_date")
      .in("student_id", ids)
      .gte("log_date", weekStart),
    supabase
      .from("student_test_progress")
      .select("student_id")
      .in("student_id", ids)
      .gte("completed_at", `${weekStart}T00:00:00+03:00`),
    supabase
      .from("student_profiles")
      .select("id, daily_goal_minutes, daily_goal_questions")
      .in("id", ids),
    supabase
      .from("study_log")
      .select("student_id, minutes, question_count")
      .in("student_id", ids)
      .eq("log_date", todayInIstanbul()),
    unreadAnnouncements(),
    getStudentCalendarItems(selectedStudentId!),
  ]);
  const homeworkRows = (homeworkResult.data as HomeworkRow[] | null) ?? [];
  const scheduleRows = (scheduleResult.data as StudyScheduleEntry[] | null) ?? [];
  const examRows =
    (examsResult.data as (Exam & { exam_subjects: ExamSubject[] })[] | null) ?? [];
  const homeworkByStudent = groupByStudent(homeworkRows);
  const scheduleByStudent = groupByStudent(scheduleRows);
  const examByStudent = groupByStudent(examRows);
  const studyDays = new Map<string, Set<string>>();
  for (const row of studyResult.data ?? []) {
    const set = studyDays.get(row.student_id) ?? new Set<string>();
    set.add(row.log_date);
    studyDays.set(row.student_id, set);
  }
  const testsByStudent = new Map<string, number>();
  for (const row of testsResult.data ?? [])
    testsByStudent.set(row.student_id, (testsByStudent.get(row.student_id) ?? 0) + 1);
  const goalRows = new Map((profilesResult.data ?? []).map((row) => [row.id, row]));
  const todayLogs = (logsTodayResult.data ?? []) as Array<{
    student_id: string;
    minutes: number;
    question_count: number | null;
  }>;
  const goalFor = (id: string) => {
    const row = goalRows.get(id);
    return calculateDailyGoal(
      row?.daily_goal_minutes ?? null,
      row?.daily_goal_questions ?? null,
      todayLogs.filter((log) => log.student_id === id),
    );
  };
  const weeklyStory: WeeklySummaryChild[] = children.map((child) => {
    const ownHomework = homeworkByStudent.get(child.id) ?? [];
    const exams = (examByStudent.get(child.id) ?? [])
      .slice(0, 2)
      .map((exam) => mapExam(exam));
    return {
      studentId: child.id,
      studentName: firstName(child.full_name),
      completedHomework: ownHomework.filter((row) => row.status === "completed").length,
      incompleteHomework: ownHomework.filter(
        (row) =>
          row.status === "incomplete" || effectiveHomeworkStatus(row) === "overdue",
      ).length,
      testsSolved: testsByStudent.get(child.id) ?? 0,
      netChange:
        exams.length >= 2
          ? Math.round((exams[0].totalNet - exams[1].totalNet) * 100) / 100
          : null,
      studyDays: studyDays.get(child.id)?.size ?? 0,
      goal: goalFor(child.id),
    };
  });
  const childrenContext = children.map((child) => ({
    id: child.id,
    name: firstName(child.full_name),
    grade: child.grade_level,
    urgentCount: (homeworkByStudent.get(child.id) ?? []).filter(
      (row) => effectiveHomeworkStatus(row) === "overdue",
    ).length,
    goal: goalFor(child.id),
  }));
  const selectedName = childrenContext.find(
    (child) => child.id === selectedStudentId,
  )?.name;
  const selectedHomework = (homeworkByStudent.get(selectedStudentId!) ?? [])
    .filter((row) => row.status !== "completed")
    .map((row) => mapHomework(row, selectedName));
  const selectedSchedule = (scheduleByStudent.get(selectedStudentId!) ?? []).map((row) =>
    mapSchedule(row, selectedName),
  );
  const selectedExams = (examByStudent.get(selectedStudentId!) ?? [])
    .slice(0, 5)
    .map((row) => mapExam(row, selectedName));
  const priorities: PriorityItem[] = [];
  for (const child of childrenContext) {
    for (const row of (homeworkByStudent.get(child.id) ?? []).filter(
      (item) => effectiveHomeworkStatus(item) === "overdue",
    ))
      priorities.push({
        id: `urgent-${row.id}`,
        kind: "homework",
        tone: "urgent",
        title: `${child.name}: ${row.title}`,
        detail: "Teslim tarihi geçti",
        studentName: child.name,
        href: "/parent/homework",
        sortRank: 10,
      });
  }
  for (const item of selectedSchedule.filter(
    (entry) => entry.day === todayDayIndex() && !entry.completedAt,
  ))
    priorities.push({
      id: `schedule-${item.id}`,
      kind: "schedule",
      tone: "warning",
      title: item.label,
      detail: `${selectedName ?? "Öğrenci"} · bugün ${item.start}`,
      studentName: selectedName,
      href: "/parent/schedule",
      sortRank: 20,
    });
  for (const item of selectedHomework.filter(
    (entry) => entry.dueDate === todayInIstanbul(),
  ))
    priorities.push({
      id: `due-${item.id}`,
      kind: "homework",
      tone: "warning",
      title: item.title,
      detail: "Bugün teslim",
      studentName: selectedName,
      href: "/parent/homework",
      sortRank: 30,
    });
  announcements.forEach((item) =>
    priorities.push({
      id: `announcement-${item.id}`,
      kind: "announcement",
      tone: "info",
      title: item.title,
      detail: "Okunmamış duyuru",
      href: item.link ?? "/parent/announcements",
      sortRank: 50,
    }),
  );
  if (!priorities.length)
    priorities.push({
      id: "all-clear",
      kind: "success",
      tone: "success",
      title: "Her şey yolunda",
      detail: "Çocukların için bekleyen acil bir konu yok.",
      sortRank: 999,
    });
  return {
    role: "parent",
    firstName: firstName(profile.full_name),
    todayLabel: todayLabel(),
    priorities: priorities.sort((a, b) => a.sortRank - b.sortRank),
    selectedStudentId,
    children: childrenContext,
    selectedHomework,
    selectedSchedule,
    selectedExams,
    weeklyStory,
    upcomingEvents: upcomingOnly(
      calendar.map((item) => ({
        id: item.id,
        title: item.title,
        date: item.date,
        type: item.type,
      })),
    ),
  };
}

export async function getDashboardData(
  profile: Profile,
  layout: StoredLayout | null = null,
): Promise<DashboardData> {
  if (profile.role === "teacher") return getTeacherData(profile);
  if (profile.role === "parent") return getParentData(profile, layout);
  return getStudentData(profile);
}

export async function getSavedLayout(): Promise<StoredLayout | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("dashboard_layouts")
    .select("layout")
    .maybeSingle();
  return (data?.layout as StoredLayout | undefined) ?? null;
}

export function greetingLine(firstNameValue: string, now = new Date()) {
  return `${greetingFor(now)}, ${firstNameValue}`;
}

export function resolvedLayout(
  role: Profile["role"],
  layout: StoredLayout | null,
  studentIds: string[] = [],
): StoredLayoutV2 {
  return normalizeDashboardLayout(role, layout, studentIds);
}
