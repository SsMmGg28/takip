import { createClient } from "@/lib/supabase/server";
import { getAccessibleStudentsWithGrades } from "@/lib/students";
import { getStudentShelf, getPendingBooks } from "@/lib/books";
import { expandCalendarEvent, getStudentCalendarItems } from "@/lib/calendar";
import { calculateNet } from "@/lib/exam-shared";
import { effectiveHomeworkStatus } from "@/lib/homework";
import { getStudentStudySummary } from "@/lib/study-log-fetch";
import { currentWeekStart } from "@/lib/week";
import { WIDGET_IDS_BY_ROLE, type DashboardWidgetId } from "@/lib/dashboard-layout";
import type {
  AppNotification,
  CalendarEvent,
  Exam,
  ExamSubject,
  Homework,
  Profile,
  ResourceBook,
  ResourceBookSection,
  StudentTestProgress,
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

function needs(widgets: ReadonlySet<DashboardWidgetId>, ...ids: DashboardWidgetId[]) {
  return ids.some((id) => widgets.has(id));
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
  const list = (exams as (Exam & { exam_subjects: ExamSubject[] })[] | null) ?? [];

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

function emptyMapFor<T>(ids: string[]): Map<string, T[]> {
  return new Map(ids.map((id) => [id, []]));
}

async function getPendingHomeworkBulk(studentIds: string[]) {
  const result = emptyMapFor<HomeworkItem>(studentIds);
  if (!studentIds.length) return result;
  const supabase = await createClient();
  const { data } = await supabase
    .from("homework")
    .select("id, title, due_date, status, student_id")
    .in("student_id", studentIds)
    .in("status", ["assigned", "incomplete", "overdue"])
    .order("due_date", { ascending: true, nullsFirst: false });
  for (const row of (data as Homework[] | null) ?? []) {
    result.get(row.student_id)?.push({
      id: row.id,
      title: row.title,
      dueDate: row.due_date,
      status: effectiveHomeworkStatus(row),
    });
  }
  for (const items of result.values()) items.splice(8);
  return result;
}

async function getScheduleItemsBulk(studentIds: string[]) {
  const result = emptyMapFor<ScheduleItem>(studentIds);
  if (!studentIds.length) return result;
  const supabase = await createClient();
  const { data } = await supabase
    .from("study_schedule_entries")
    .select("*")
    .eq("week_start", currentWeekStart())
    .in("student_id", studentIds)
    .order("day_of_week")
    .order("start_time");
  for (const row of (data as StudyScheduleEntry[] | null) ?? []) {
    result.get(row.student_id)?.push({
      id: row.id,
      day: row.day_of_week,
      start: shortTime(row.start_time),
      end: shortTime(row.end_time),
      label: row.activity_label,
    });
  }
  return result;
}

async function getRecentExamsBulk(studentIds: string[]) {
  const result = emptyMapFor<ExamItem>(studentIds);
  if (!studentIds.length) return result;
  const supabase = await createClient();
  const { data } = await supabase
    .from("exams")
    .select("*, exam_subjects(*)")
    .in("student_id", studentIds)
    .order("exam_date", { ascending: false });
  const rows = (data as (Exam & { exam_subjects: ExamSubject[] })[] | null) ?? [];
  for (const exam of rows) {
    const target = result.get(exam.student_id);
    if (!target || target.length >= 3) continue;
    const totalNet = exam.exam_subjects.reduce(
      (sum, subject) =>
        sum + calculateNet(subject.correct_count, subject.incorrect_count),
      0,
    );
    target.push({
      id: exam.id,
      name: exam.exam_name,
      date: exam.exam_date,
      totalNet: Math.round(totalNet * 100) / 100,
      score: exam.score,
    });
  }
  return result;
}

type DashboardBookRow = ResourceBook & {
  resource_book_sections: ResourceBookSection[];
};

async function getStudentShelvesBulk(studentIds: string[]) {
  const result = emptyMapFor<BookItem>(studentIds);
  if (!studentIds.length) return result;
  const supabase = await createClient();
  const { data: links } = await supabase
    .from("student_books")
    .select("id, student_id, book_id")
    .in("student_id", studentIds);
  if (!links?.length) return result;

  const bookIds = Array.from(new Set(links.map((link) => link.book_id)));
  const [{ data: books }, { data: progress }] = await Promise.all([
    supabase
      .from("resource_books")
      .select("*, resource_book_sections(*)")
      .in("id", bookIds)
      .eq("approved", true),
    supabase
      .from("student_test_progress")
      .select("student_id, section_id")
      .in("student_id", studentIds),
  ]);

  const bookById = new Map(
    ((books as DashboardBookRow[] | null) ?? []).map((book) => [book.id, book]),
  );
  const progressCounts = new Map<string, number>();
  for (const row of (progress as
    Pick<StudentTestProgress, "student_id" | "section_id">[] | null) ?? []) {
    const key = `${row.student_id}:${row.section_id}`;
    progressCounts.set(key, (progressCounts.get(key) ?? 0) + 1);
  }

  for (const link of links) {
    const book = bookById.get(link.book_id);
    if (!book) continue;
    const sections = book.resource_book_sections;
    result.get(link.student_id)?.push({
      id: link.id,
      name: book.name,
      done: sections.reduce(
        (sum, section) =>
          sum + (progressCounts.get(`${link.student_id}:${section.id}`) ?? 0),
        0,
      ),
      total: sections.reduce((sum, section) => sum + section.test_count, 0),
    });
  }
  return result;
}

async function getCalendarItemsBulk(studentIds: string[]): Promise<EventItem[]> {
  if (!studentIds.length) return [];
  const supabase = await createClient();
  const dueWindowStart = new Date();
  dueWindowStart.setMonth(dueWindowStart.getMonth() - 6);
  const idList = studentIds.join(",");

  const [{ data: events }, { data: homework }] = await Promise.all([
    supabase
      .from("calendar_events")
      .select("id, title, description, type, start_at, recurrence")
      .or(`student_id.is.null,student_id.in.(${idList})`),
    supabase
      .from("homework")
      .select("id, title, due_date")
      .in("student_id", studentIds)
      .not("due_date", "is", null)
      .gte("due_date", dueWindowStart.toISOString().slice(0, 10)),
  ]);

  const expanded = ((events as CalendarEvent[] | null) ?? []).flatMap((event) =>
    expandCalendarEvent(event).map((item) => ({
      id: item.id,
      title: item.title,
      date: item.date,
      type: item.type,
    })),
  );
  for (const item of homework ?? []) {
    expanded.push({
      id: `hw-${item.id}`,
      title: `Ödev teslim: ${item.title}`,
      date: item.due_date,
      type: "homework_deadline",
    });
  }
  return upcomingOnly(expanded);
}

function upcomingOnly(events: EventItem[], limit = 8): EventItem[] {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return events
    .filter((e) => new Date(e.date).getTime() >= startOfToday.getTime())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, limit);
}

async function getStudentData(
  profile: Profile,
  widgets: ReadonlySet<DashboardWidgetId>,
): Promise<DashboardData> {
  const supabase = await createClient();

  const needsHomework = needs(widgets, "stats", "homework");
  const needsSchedule = needs(widgets, "stats", "today-schedule", "weekly-schedule");
  const needsExams = needs(widgets, "stats", "exams");

  const [
    homework,
    schedule,
    calendarItems,
    exams,
    shelf,
    notifications,
    statusRows,
    study,
  ] = await Promise.all([
    needsHomework ? getPendingHomework(profile.id) : Promise.resolve([]),
    needsSchedule ? getScheduleItems(profile.id) : Promise.resolve([]),
    widgets.has("events") ? getStudentCalendarItems(profile.id) : Promise.resolve([]),
    needsExams ? getRecentExams(profile.id) : Promise.resolve([]),
    widgets.has("books") ? getStudentShelf(profile.id) : Promise.resolve([]),
    widgets.has("notifications") ? getOwnNotifications() : Promise.resolve([]),
    widgets.has("stats")
      ? supabase.from("homework").select("status").eq("student_id", profile.id)
      : Promise.resolve({ data: [] }),
    widgets.has("streak") ? getStudentStudySummary(profile.id) : Promise.resolve(null),
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
      current: study?.current ?? 0,
      best: study?.best ?? 0,
      todayMinutes: study?.todayMinutes ?? 0,
      weekDays: study?.week.days ?? 0,
    },
  };
}

async function getParentData(
  profile: Profile,
  widgets: ReadonlySet<DashboardWidgetId>,
): Promise<DashboardData> {
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
    homeworkByChild,
    scheduleByChild,
    calendarItems,
    examsByChild,
    shelfByChild,
  ] = await Promise.all([
    widgets.has("stats") && childIds.length
      ? supabase
          .from("homework")
          .select("id", { count: "exact", head: true })
          .in("student_id", childIds)
          .in("status", ["assigned", "incomplete", "overdue"])
      : empty,
    widgets.has("weekly-summary") && childIds.length
      ? supabase
          .from("homework")
          .select("student_id, status")
          .in("student_id", childIds)
          .in("status", ["completed", "incomplete"])
          .gte("checked_at", weekStartIso)
      : empty,
    widgets.has("weekly-summary") && childIds.length
      ? supabase
          .from("student_test_progress")
          .select("student_id")
          .in("student_id", childIds)
          .gte("completed_at", weekStartIso)
      : empty,
    widgets.has("weekly-summary") && childIds.length
      ? supabase
          .from("study_log")
          .select("student_id, log_date")
          .in("student_id", childIds)
          .gte("log_date", currentWeekStart())
      : empty,
    widgets.has("notifications") ? getOwnNotifications() : Promise.resolve([]),
    needs(widgets, "homework", "stats", "weekly-summary")
      ? getPendingHomeworkBulk(childIds)
      : Promise.resolve(emptyMapFor<HomeworkItem>(childIds)),
    needs(widgets, "today-schedule", "weekly-schedule", "stats")
      ? getScheduleItemsBulk(childIds)
      : Promise.resolve(emptyMapFor<ScheduleItem>(childIds)),
    widgets.has("events") ? getCalendarItemsBulk(childIds) : Promise.resolve([]),
    needs(widgets, "exams", "weekly-summary")
      ? getRecentExamsBulk(childIds)
      : Promise.resolve(emptyMapFor<ExamItem>(childIds)),
    needs(widgets, "books", "stats")
      ? getStudentShelvesBulk(childIds)
      : Promise.resolve(emptyMapFor<BookItem>(childIds)),
  ]);

  const perChild = children.map((child) => ({
    child,
    name: firstName(child.full_name),
    homework: homeworkByChild.get(child.id) ?? [],
    schedule: scheduleByChild.get(child.id) ?? [],
    exams: examsByChild.get(child.id) ?? [],
    shelf: shelfByChild.get(child.id) ?? [],
  }));

  const weeklyCompletedById = new Map<string, number>();
  const weeklyIncompleteById = new Map<string, number>();
  for (const row of (weeklyHomeworkRows as { student_id: string; status: string }[]) ??
    []) {
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
    .flatMap((c) =>
      c.homework.map((h) => ({ ...h, studentName: withName ? c.name : undefined })),
    )
    .slice(0, 10);
  const schedule = perChild.flatMap((c) =>
    c.schedule.map((s) => ({ ...s, studentName: withName ? c.name : undefined })),
  );
  const exams = perChild
    .flatMap((c) =>
      c.exams.map((e) => ({ ...e, studentName: withName ? c.name : undefined })),
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);
  const books = perChild.flatMap((c) =>
    c.shelf.map((b) => ({
      ...b,
      studentName: withName ? c.name : undefined,
    })),
  );

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
    events: calendarItems,
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

async function getTeacherData(
  profile: Profile,
  widgets: ReadonlySet<DashboardWidgetId>,
): Promise<DashboardData> {
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
    widgets.has("stats")
      ? supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "student")
      : Promise.resolve({ count: 0 }),
    widgets.has("stats")
      ? supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "parent")
      : Promise.resolve({ count: 0 }),
    widgets.has("stats")
      ? supabase
          .from("homework")
          .select("id", { count: "exact", head: true })
          .eq("status", "assigned")
      : Promise.resolve({ count: 0 }),
    widgets.has("homework")
      ? supabase
          .from("homework")
          .select("id, title, due_date, status, student_id")
          .in("status", ["assigned", "incomplete", "overdue"])
          .order("due_date", { ascending: true, nullsFirst: false })
          .limit(10)
      : Promise.resolve({ data: [] }),
    widgets.has("events")
      ? supabase
          .from("calendar_events")
          .select("id, title, start_at, type")
          .gte("start_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
          .order("start_at")
          .limit(8)
      : Promise.resolve({ data: [] }),
    needs(widgets, "book-approvals", "stats") ? getPendingBooks() : Promise.resolve([]),
    needs(widgets, "people", "homework")
      ? getAccessibleStudentsWithGrades(profile)
      : Promise.resolve([]),
    widgets.has("notifications") ? getOwnNotifications() : Promise.resolve([]),
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
export async function getDashboardData(
  profile: Profile,
  widgets: ReadonlySet<DashboardWidgetId> = new Set(WIDGET_IDS_BY_ROLE[profile.role]),
): Promise<DashboardData> {
  if (profile.role === "teacher") return getTeacherData(profile, widgets);
  if (profile.role === "parent") return getParentData(profile, widgets);
  return getStudentData(profile, widgets);
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
