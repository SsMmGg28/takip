"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { AlertCircle, CalendarDays, GraduationCap, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookApprovalActions } from "@/components/resources/book-approval-actions";
import {
  DashboardHomeFrame,
  EmptyLine,
} from "@/components/dashboard/dashboard-home-shared";
import type {
  DashboardSectionId,
  StoredLayoutV2,
  TeacherDashboardData,
} from "@/lib/dashboard-types";

// Ağır form diyalogları ayrı chunk'ta kalır; bölüm gizliyse hiç yüklenmez
// (recharts'taki subject-filter-charts deseni).
const CheckHomeworkDialog = dynamic(
  () =>
    import("@/components/teacher/check-homework-dialog").then(
      (m) => m.CheckHomeworkDialog,
    ),
  { loading: () => <Skeleton className="h-9 w-28 rounded-md" /> },
);
const CreateHomeworkDialog = dynamic(
  () =>
    import("@/components/teacher/create-homework-dialog").then(
      (m) => m.CreateHomeworkDialog,
    ),
  { loading: () => <Skeleton className="h-9 w-full rounded-md" /> },
);
const CreateCalendarEventDialog = dynamic(
  () =>
    import("@/components/teacher/create-calendar-event-dialog").then(
      (m) => m.CreateCalendarEventDialog,
    ),
  { loading: () => <Skeleton className="h-9 w-full rounded-md" /> },
);

/** Öğretmen dashboard'u: yalnız öğretmen rolüne inen client chunk. */
export function DashboardHomeTeacher({
  data,
  initialLayout,
}: {
  data: TeacherDashboardData;
  initialLayout: StoredLayoutV2;
}) {
  return (
    <DashboardHomeFrame
      data={data}
      initialLayout={initialLayout}
      renderSection={(id) => <TeacherSection id={id} data={data} />}
    />
  );
}

function TeacherSection({
  id,
  data,
}: {
  id: DashboardSectionId;
  data: TeacherDashboardData;
}) {
  if (id === "action-queue")
    return (
      <div className="space-y-4">
        {data.actionHomework.length === 0 && data.pendingBooks.length === 0 ? (
          <EmptyLine>İşlem kuyruğu temiz.</EmptyLine>
        ) : (
          <>
            {data.actionHomework.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.studentName} · {item.dueDate ?? "Tarihsiz"}
                  </p>
                </div>
                <CheckHomeworkDialog
                  homeworkId={item.id}
                  homeworkTitle={item.title}
                  studentName={item.studentName ?? "Öğrenci"}
                  tests={(item.tests ?? []).map((test) => ({ ...test }))}
                  checkedBefore={Boolean(item.checkedAt)}
                  studentSaysDone={item.studentMarkedDone}
                  initialFeedback={item.feedback}
                />
              </div>
            ))}
            {data.pendingBooks.slice(0, 4).map((book) => (
              <div
                key={book.id}
                className="flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{book.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {book.subject ?? "Ders belirtilmedi"} · onay bekliyor
                  </p>
                </div>
                <BookApprovalActions bookId={book.id} bookName={book.name} />
              </div>
            ))}
          </>
        )}
      </div>
    );
  if (id === "quick-create")
    return (
      <div className="grid gap-2 sm:grid-cols-3">
        <CreateHomeworkDialog
          students={data.students.map((student) => ({
            id: student.id,
            fullName: student.name,
            grade: student.grade,
          }))}
          books={data.homeworkBooks}
          triggerLabel="Ödev oluştur"
        />
        <CreateCalendarEventDialog
          students={data.students.map((student) => ({
            id: student.id,
            full_name: student.name,
            role: "student",
            username: "",
            phone: null,
            must_change_password: false,
            theme_color: "blue",
            created_at: "",
          }))}
        />
        <Button asChild variant="outline">
          <Link href="/teacher/exams">
            <GraduationCap className="mr-1.5 h-4 w-4" />
            Deneme oluştur
          </Link>
        </Button>
      </div>
    );
  if (id === "student-radar")
    return (
      <div className="space-y-2">
        {data.radar.length ? (
          data.radar.slice(0, 8).map((signal) => (
            <Link
              key={signal.id}
              href={signal.href}
              className="flex min-h-14 items-center gap-3 rounded-2xl border p-3 hover:bg-accent"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                {signal.reason === "net_drop" ? (
                  <TrendingDown className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{signal.studentName}</span>
                <span className="block text-xs text-muted-foreground">
                  {signal.explanation}
                </span>
              </span>
            </Link>
          ))
        ) : (
          <EmptyLine>Radar eşiklerine takılan öğrenci yok.</EmptyLine>
        )}
      </div>
    );
  if (id === "today-calendar")
    return (
      <div className="space-y-2">
        {data.events.length ? (
          data.events.map((event) => (
            <Link
              key={event.id}
              href="/teacher/calendar"
              className="flex min-h-14 items-center gap-3 rounded-2xl bg-muted/45 p-3"
            >
              <CalendarDays className="h-4 w-4 text-primary" />
              <span className="min-w-0 flex-1 text-sm font-semibold">{event.title}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(event.date).toLocaleTimeString("tr-TR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </Link>
          ))
        ) : (
          <EmptyLine>Yaklaşan takvim kaydı yok.</EmptyLine>
        )}
      </div>
    );
  return null;
}
