import { createClient } from "@/lib/supabase/server";
import { getAccessibleStudents, withGrades } from "@/lib/students";
import { getStudentShelf, getPendingBooks } from "@/lib/books";
import { getStudentCalendarItems } from "@/lib/calendar";
import { calculateNet } from "@/lib/exam-shared";
import { effectiveHomeworkStatus } from "@/lib/homework";
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
  const { data: exams } = await supabase
    .from("exams")
    .select("*")
    .eq("student_id", studentId)
    .order("exam_date", { ascending: false })
    .limit(limit);
  const list = (exams as Exam[]) ?? [];
  if (!list.length) return [];

  const { data: subjects } = await supabase
    .from("exam_subjects")
    .select("*")
    .in(
      "exam_id",
      list.map((e) => e.id),
    );
  const subjectRows = (subjects as ExamSubject[]) ?? [];

  return list.map((exam) => {
    const net = subjectRows
      .filter((s) => s.exam_id === exam.id)
      .reduce((sum, s) => sum + calculateNet(s.correct_count, s.incorrect_count), 0);
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

  const [homework, schedule, calendarItems, exams, shelf, notifications, statusRows] =
    await Promise.all([
      getPendingHomework(profile.id),
      getScheduleItems(profile.id),
      getStudentCalendarItems(profile.id),
      getRecentExams(profile.id),
      getStudentShelf(profile.id),
      getOwnNotifications(),
      supabase.from("homework").select("status").eq("student_id", profile.id),
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
  };
}

async function getParentData(profile: Profile): Promise<DashboardData> {
  const supabase = await createClient();
  const children = await getAccessibleStudents(profile);
  const childrenWithGrades = await withGrades(children);

  const { count: pendingCount } = children.length
    ? await supabase
        .from("homework")
        .select("id", { count: "exact", head: true })
        .in("student_id", children.map((c) => c.id))
        .in("status", ["assigned", "incomplete", "overdue"])
    : { count: 0 };

  // Haftanın başı (Pazartesi 00:00) — haftalık özet sayaçları için.
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekStartIso = weekStart.toISOString();

  const perChild = await Promise.all(
    children.map(async (child) => {
      const name = firstName(child.full_name);
      const [
        homework,
        schedule,
        calendarItems,
        exams,
        shelf,
        { count: weeklyCompleted },
        { count: weeklyIncomplete },
        { count: weeklyTests },
      ] = await Promise.all([
        getPendingHomework(child.id),
        getScheduleItems(child.id),
        getStudentCalendarItems(child.id),
        getRecentExams(child.id, 3),
        getStudentShelf(child.id),
        supabase
          .from("homework")
          .select("id", { count: "exact", head: true })
          .eq("student_id", child.id)
          .eq("status", "completed")
          .gte("checked_at", weekStartIso),
        supabase
          .from("homework")
          .select("id", { count: "exact", head: true })
          .eq("student_id", child.id)
          .eq("status", "incomplete")
          .gte("checked_at", weekStartIso),
        supabase
          .from("student_test_progress")
          .select("id", { count: "exact", head: true })
          .eq("student_id", child.id)
          .gte("completed_at", weekStartIso),
      ]);
      const weeklySummary: WeeklySummaryChild = {
        studentId: child.id,
        studentName: firstName(child.full_name),
        completedHomework: weeklyCompleted ?? 0,
        incompleteHomework: weeklyIncomplete ?? 0,
        testsSolved: weeklyTests ?? 0,
        netChange:
          exams.length >= 2
            ? Math.round((exams[0].totalNet - exams[1].totalNet) * 100) / 100
            : null,
      };
      return { child, name, homework, schedule, calendarItems, exams, shelf, weeklySummary };
    }),
  );

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
    people: childrenWithGrades.map((s) => ({
      id: s.id,
      name: s.full_name,
      grade: s.grade_level,
    })),
    notifications: await getOwnNotifications(),
    weeklySummary: perChild.map((c) => c.weeklySummary),
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
    getAccessibleStudents(profile),
    getOwnNotifications(),
  ]);

  const studentIds = Array.from(new Set((recentHomework ?? []).map((h) => h.student_id)));
  const nameById = new Map<string, string>();
  if (studentIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", studentIds);
    for (const p of profiles ?? []) nameById.set(p.id, firstName(p.full_name));
  }

  const studentsWithGrades = await withGrades(students);

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
    people: studentsWithGrades.map((s) => ({
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
