import { createClient } from "@/lib/supabase/server";
import { getAccessibleStudentsWithGrades } from "@/lib/students";
import { getStudentShelf, getPendingBooks } from "@/lib/books";
import { getStudentCalendarItems } from "@/lib/calendar";
import { calculateNet } from "@/lib/exam-shared";
import { effectiveHomeworkStatus } from "@/lib/homework";
import { getStudentStudySummary } from "@/lib/study-log-fetch";
import { currentWeekStart } from "@/lib/week";
import type {
  AppNotification,
  Exam,
  ExamSubject,
  Homework,
  Profile,
  StudyScheduleEntry,
} from "@/lib/types";
import type {
  BookItem,
  DashboardData,
  EventItem,
  ExamItem,
  HomeworkItem,
  ScheduleItem,
  StoredLayout,
  WeeklySummaryChild,
} from "@/lib/dashboard-types";

function firstName(fullName: string) {
  return fullName.split(/\s+/)[0] ?? fullName;
}

/** "HH:MM:SS" → "HH:MM" */
function shortTime(t: string) {
  return t.slice(0, 5);
}

async function getOwnNotifications(): Promise<AppNotification[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(8);
  return (data as AppNotification[]) ?? [];
}

/** Bir öğrencinin son denemelerini net hesabıyla getirir. */
async function getRecentExams(studentId: string, limit = 5): Promise<ExamItem[]> {
  const supabase = await createClient();
  // Dersler embedded select ile aynı sorguda gelir; ikinci gidiş-dönüş yok.
  const { data: exams } = await supabase
    .from("exams")
    .select("*, exam_subjects(*)")
    .eq("student_id", studentId)
    .order("exam_date", { ascending: false })
    .limit(limit);
  const list = ((exams as (Exam & { exam_subjects: ExamSubject[] })[] | null) ?? []);

  return list.map((exam) => {
    const net = exam.exam_subjects.reduce(
      (sum, s) => sum + calculateNet(s.correct_count, s.incorrect_count),
      0,
    );
    return {
      id: exam.id,
      name: exam.exam_name,
      date: exam.exam_date,
      totalNet: Math.round(net * 100) / 100,
      score: exam.score,
    };
  });
}

async function getPendingHomework(studentId: string): Promise<HomeworkItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("homework")
    .select("id, title, due_date, status")
    .eq("student_id", studentId)
    .in("status", ["assigned", "incomplete", "overdue"])
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(8);
  return ((data as Homework[]) ?? []).map((h) => ({
    id: h.id,
    title: h.title,
    dueDate: h.due_date,
    status: effectiveHomeworkStatus(h),
  }));
}

async function getScheduleItems(studentId: string): Promise<ScheduleItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("study_schedule_entries")
    .select("*")
    .eq("week_start", currentWeekStart())
    .eq("student_id", studentId)
    .order("day_of_week")
    .order("start_time");
  return ((data as StudyScheduleEntry[]) ?? []).map((e) => ({
    id: e.id,
    day: e.day_of_week,
    start: shortTime(e.start_time),
    end: shortTime(e.end_time),
    label: e.activity_label,
  }));
}

function upcomingOnly(events: EventItem[], limit = 8): EventItem[] {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return events
    .filter((e) => new Date(e.date).getTime() >= startOfToday.getTime())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, limit);
}

async function getStudentData(profile: Profile): Promise<DashboardData> {
  const supabase = await createClient();

  const [homework, schedule, calendarItems, exams, shelf, notifications, statusRows, study] =
    await Promise.all([
      getPendingHomework(profile.id),
      getScheduleItems(profile.id),
      getStudentCalendarItems(profile.id),
      getRecentExams(profile.id),
      getStudentShelf(profile.id),
      getOwnNotifications(),
      supabase.from("homework").select("status").eq("student_id", profile.id),
      getStudentStudySummary(profile.id),
    ]);

  const statuses = (statusRows.data ?? []).map((r) => r.status as string);
  const completedCount = statuses.filter((s) => s === "completed").length;
  const pendingCount = statuses.filter((s) => s !== "completed").length;

  const books: BookItem[] = shelf.map((b) => ({
    id: b.id,
    name: b.name,
    done: b.completedCount,
    total: b.totalTests,
  }));

  return {
    role: "student",
    firstName: firstName(profile.full_name),
    stats: [
      { label: "Bekleyen Ödev", value: pendingCount, href: "/student/homework" },
      { label: "Tamamlanan Ödev", value: completedCount, href: "/student/homework" },
      {
        label: "Haftalık Etkinlik",
        value: schedule.length,
        hint: "çalışma programında",
        href: "/student/schedule",
      },
      {
        label: "Son Deneme Neti",
        value: exams[0] ? exams[0].totalNet : "—",
        hint: exams[0]?.name,
        href: "/student/exams",
      },
    ],
    homework,
    schedule,
    events: upcomingOnly(
      calendarItems.map((c) => ({
        id: c.id,
        title: c.title,
        date: c.date,
        type: c.type,
      })),
    ),
    exams,
    books,
    pendingBooks: [],
    people: [],
    notifications,
    weeklySummary: [],
    studyStreak: {
      current: study.current,
      best: study.best,
      todayMinutes: study.todayMinutes,
      weekDays: study.week.days,
    },
  };
}

async function getParentData(profile: Profile): Promise<DashboardData> {
  const supabase = await createClient();
  const children = await getAccessibleStudentsWithGrades(profile);
  const childIds = children.map((c) => c.id);

  // Haftanın başı (Pazartesi 00:00) — haftalık özet sayaçları için.
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekStartIso = weekStart.toISOString();

  // Haftalık sayaçlar çocuk başına ayrı ayrı değil, tüm çocuklar için tek
  // sorguda çekilip bellekte gruplanır (çocuk sayısıyla sorgu sayısı büyümez).
  const empty = Promise.resolve({ data: [], count: 0 });
  const [
    { count: pendingCount },
    { data: weeklyHomeworkRows },
    { data: weeklyTestRows },
    { data: studyRows },
    notifications,
    perChild,
  ] = await Promise.all([
    childIds.length
      ? supabase
          .from("homework")
          .select("id", { count: "exact", head: true })
          .in("student_id", childIds)
          .in("status", ["assigned", "incomplete", "overdue"])
      : empty,
    childIds.length
      ? supabase
          .from("homework")
          .select("student_id, status")
          .in("student_id", childIds)
          .in("status", ["completed", "incomplete"])
          .gte("checked_at", weekStartIso)
      : empty,
    childIds.length
      ? supabase
          .from("student_test_progress")
          .select("student_id")
          .in("student_id", childIds)
          .gte("completed_at", weekStartIso)
      : empty,
    childIds.length
      ? supabase
          .from("study_log")
          .select("student_id, log_date")
          .in("student_id", childIds)
          .gte("log_date", currentWeekStart())
      : empty,
    getOwnNotifications(),
    Promise.all(
      children.map(async (child) => {
        const name = firstName(child.full_name);
        const [homework, schedule, calendarItems, exams, shelf] = await Promise.all([
          getPendingHomework(child.id),
          getScheduleItems(child.id),
          getStudentCalendarItems(child.id),
          getRecentExams(child.id, 3),
          getStudentShelf(child.id),
        ]);
        return { child, name, homework, schedule, calendarItems, exams, shelf };
      }),
    ),
  ]);

  const weeklyCompletedById = new Map<string, number>();
  const weeklyIncompleteById = new Map<string, number>();
  for (const row of (weeklyHomeworkRows as { student_id: string; status: string }[]) ?? []) {
    const map = row.status === "completed" ? weeklyCompletedById : weeklyIncompleteById;
    map.set(row.student_id, (map.get(row.student_id) ?? 0) + 1);
  }
  const weeklyTestsById = new Map<string, number>();
  for (const row of (weeklyTestRows as { student_id: string }[]) ?? []) {
    weeklyTestsById.set(row.student_id, (weeklyTestsById.get(row.student_id) ?? 0) + 1);
  }
  const studyDaysById = new Map<string, Set<string>>();
  for (const row of (studyRows as { student_id: string; log_date: string }[]) ?? []) {
    if (!studyDaysById.has(row.student_id)) studyDaysById.set(row.student_id, new Set());
    studyDaysById.get(row.student_id)!.add(row.log_date);
  }

  const perChildWithSummary = perChild.map((c) => {
    const weeklySummary: WeeklySummaryChild = {
      studentId: c.child.id,
      studentName: c.name,
      completedHomework: weeklyCompletedById.get(c.child.id) ?? 0,
      incompleteHomework: weeklyIncompleteById.get(c.child.id) ?? 0,
      testsSolved: weeklyTestsById.get(c.child.id) ?? 0,
      netChange:
        c.exams.length >= 2
          ? Math.round((c.exams[0].totalNet - c.exams[1].totalNet) * 100) / 100
          : null,
      studyDays: studyDaysById.get(c.child.id)?.size ?? 0,
    };
    return { ...c, weeklySummary };
  });

  const withName = children.length > 1;
  const homework = perChild
    .flatMap((c) => c.homework.map((h) => ({ ...h, studentName: withName ? c.name : undefined })))
    .slice(0, 10);
  const schedule = perChild.flatMap((c) =>
    c.schedule.map((s) => ({ ...s, studentName: withName ? c.name : undefined })),
  );
  const exams = perChild
    .flatMap((c) => c.exams.map((e) => ({ ...e, studentName: withName ? c.name : undefined })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);
  const books = perChild.flatMap((c) =>
    c.shelf.map((b) => ({
      id: b.studentBookId,
      name: b.name,
      done: b.completedCount,
      total: b.totalTests,
      studentName: withName ? c.name : undefined,
    })),
  );

  const eventMap = new Map<string, EventItem>();
  for (const c of perChild) {
    for (const item of c.calendarItems) {
      eventMap.set(item.id, {
        id: item.id,
        title: item.title,
        date: item.date,
        type: item.type,
      });
    }
  }

  return {
    role: "parent",
    firstName: firstName(profile.full_name),
    stats: [
      { label: "Çocuk", value: children.length },
      { label: "Bekleyen Ödev", value: pendingCount ?? 0, href: "/parent/homework" },
      {
        label: "Haftalık Etkinlik",
        value: schedule.length,
        hint: "çalışma programında",
        href: "/parent/schedule",
      },
      { label: "Kitaplıkta Kitap", value: books.length, href: "/parent/resources" },
    ],
    homework,
    schedule,
    events: upcomingOnly(Array.from(eventMap.values())),
    exams,
    books,
    pendingBooks: [],
    people: children.map((s) => ({
      id: s.id,
      name: s.full_name,
      grade: s.grade_level,
    })),
    notifications,
    weeklySummary: perChildWithSummary.map((c) => c.weeklySummary),
  };
}

async function getTeacherData(profile: Profile): Promise<DashboardData> {
  const supabase = await createClient();

  const [
    { count: studentCount },
    { count: parentCount },
    { count: pendingHomeworkCount },
    { data: recentHomework },
    { data: events },
    pendingBooksRaw,
    students,
    notifications,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "parent"),
    supabase
      .from("homework")
      .select("id", { count: "exact", head: true })
      .eq("status", "assigned"),
    supabase
      .from("homework")
      .select("id, title, due_date, status, student_id")
      .in("status", ["assigned", "incomplete", "overdue"])
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(10),
    supabase
      .from("calendar_events")
      .select("id, title, start_at, type")
      .gte("start_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
      .order("start_at")
      .limit(8),
    getPendingBooks(),
    getAccessibleStudentsWithGrades(profile),
    getOwnNotifications(),
  ]);

  // Öğretmen tüm öğrencileri görür; ödevlerdeki isimler ayrı sorgu yerine
  // zaten çekilen öğrenci listesinden bulunur.
  const nameById = new Map(students.map((s) => [s.id, firstName(s.full_name)]));

  return {
    role: "teacher",
    firstName: firstName(profile.full_name),
    stats: [
      { label: "Öğrenci", value: studentCount ?? 0, href: "/teacher/students" },
      { label: "Veli", value: parentCount ?? 0, href: "/teacher/students" },
      {
        label: "Bekleyen Ödev",
        value: pendingHomeworkCount ?? 0,
        hint: "tüm öğrenciler",
        href: "/teacher/homework",
      },
      {
        label: "Onay Bekleyen Kitap",
        value: pendingBooksRaw.length,
        href: "/teacher/resources",
      },
    ],
    homework: ((recentHomework as Homework[]) ?? []).map((h) => ({
      id: h.id,
      title: h.title,
      dueDate: h.due_date,
      status: effectiveHomeworkStatus(h),
      studentName: nameById.get(h.student_id),
    })),
    schedule: [],
    events: upcomingOnly(
      (events ?? []).map((e) => ({
        id: e.id,
        title: e.title,
        date: e.start_at,
        type: e.type as EventItem["type"],
      })),
    ),
    exams: [],
    books: [],
    pendingBooks: pendingBooksRaw.slice(0, 6).map((b) => ({
      id: b.id,
      name: b.name,
      subject: b.subject,
    })),
    people: students.map((s) => ({
      id: s.id,
      name: s.full_name,
      grade: s.grade_level,
    })),
    notifications,
    weeklySummary: [],
  };
}

/** Rolün Anasayfa widget verilerini toplar. */
export async function getDashboardData(profile: Profile): Promise<DashboardData> {
  if (profile.role === "teacher") return getTeacherData(profile);
  if (profile.role === "parent") return getParentData(profile);
  return getStudentData(profile);
}

/** Kullanıcının kayıtlı widget yerleşimini döner (yoksa null). */
export async function getSavedLayout(): Promise<StoredLayout | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("dashboard_layouts")
    .select("layout")
    .maybeSingle();
  return (data?.layout as StoredLayout | undefined) ?? null;
}
