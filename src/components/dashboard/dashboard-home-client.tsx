"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  BellRing,
  BookOpenCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleGauge,
  ClipboardCheck,
  Clock3,
  Eye,
  EyeOff,
  GraduationCap,
  ListChecks,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Target,
  TimerReset,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";
import { AddScheduleEntryDialog } from "@/components/schedule/add-schedule-entry-dialog";
import { BookApprovalActions } from "@/components/resources/book-approval-actions";
import { CheckHomeworkDialog } from "@/components/teacher/check-homework-dialog";
import { CreateCalendarEventDialog } from "@/components/teacher/create-calendar-event-dialog";
import { CreateHomeworkDialog } from "@/components/teacher/create-homework-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountdownWidget, PomodoroWidget } from "@/components/dashboard/widgets-utility";
import { saveDashboardLayout, setDailyGoal } from "@/lib/actions/dashboard";
import {
  completeOwnScheduleEntry,
  undoOwnScheduleCompletion,
} from "@/lib/actions/schedule";
import {
  setStudentHomeworkDone,
  setStudentTestMark,
} from "@/app/student/homework/actions";
import { currentWeekStart } from "@/lib/week";
import { cn } from "@/lib/utils";
import type {
  DashboardData,
  DashboardSectionId,
  DailyGoalSummary,
  HomeworkItem,
  ParentDashboardData,
  PriorityItem,
  ScheduleItem,
  StoredLayoutV2,
  StudentDashboardData,
  TeacherDashboardData,
} from "@/lib/dashboard-types";
import type { StudyScheduleEntry } from "@/lib/types";

const SECTION_TITLES: Record<DashboardSectionId, string> = {
  "today-flow": "Bugünün Akışı",
  "homework-plan": "Ödev Planım",
  progress: "İlerlemem",
  pomodoro: "Odak Zamanlayıcısı",
  countdown: "Hedef Geri Sayımı",
  "action-queue": "İşlem Kuyruğu",
  "quick-create": "Hızlı Oluştur",
  "student-radar": "Öğrenci Radarı",
  "today-calendar": "Bugünün Takvimi",
  "weekly-story": "Haftalık Durum Hikâyesi",
  upcoming: "Yaklaşanlar",
  "academic-progress": "Akademik Gelişim",
};

function percent(done: number, goal: number | null) {
  if (!goal) return 0;
  return Math.min(100, Math.round((done / goal) * 100));
}

function GoalBars({
  goal,
  compact = false,
}: {
  goal: DailyGoalSummary;
  compact?: boolean;
}) {
  if (goal.minutesGoal === null || goal.questionsGoal === null) {
    return (
      <p className="text-sm text-muted-foreground">Henüz günlük hedef belirlenmedi.</p>
    );
  }
  return (
    <div className={cn("grid gap-3", !compact && "sm:grid-cols-2")}>
      {[
        ["Süre", goal.minutesDone, goal.minutesGoal, "dk"],
        ["Soru", goal.questionsDone, goal.questionsGoal, "soru"],
      ].map(([label, done, target, unit]) => (
        <div key={String(label)} className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="font-medium">{label}</span>
            <span className="tabular-nums text-muted-foreground">
              {done}/{target} {unit}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-700 motion-reduce:transition-none"
              style={{ width: `${percent(Number(done), Number(target))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function PriorityIcon({ item }: { item: PriorityItem }) {
  if (item.kind === "success") return <CheckCircle2 className="h-5 w-5" />;
  if (item.kind === "schedule") return <Clock3 className="h-5 w-5" />;
  if (item.kind === "homework") return <ClipboardCheck className="h-5 w-5" />;
  if (item.kind === "announcement") return <BellRing className="h-5 w-5" />;
  if (item.kind === "goal") return <Target className="h-5 w-5" />;
  if (item.kind === "approval") return <BookOpenCheck className="h-5 w-5" />;
  return <AlertCircle className="h-5 w-5" />;
}

function PriorityRow({
  item,
  prominent = false,
}: {
  item: PriorityItem;
  prominent?: boolean;
}) {
  const content = (
    <div className={cn("flex min-w-0 items-center gap-3", prominent && "items-start")}>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-2xl",
          prominent ? "h-12 w-12" : "h-10 w-10",
          item.tone === "urgent" && "bg-destructive/12 text-destructive",
          item.tone === "warning" && "bg-warning/15 text-warning-foreground",
          item.tone === "info" && "bg-primary/10 text-primary",
          item.tone === "success" && "bg-success/12 text-success",
        )}
      >
        <PriorityIcon item={item} />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate font-semibold",
            prominent ? "text-base" : "text-sm",
          )}
        >
          {item.title}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {item.detail}
        </span>
      </span>
      {item.href && <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
    </div>
  );
  return item.href ? (
    <Link
      href={item.href}
      className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {content}
    </Link>
  ) : (
    content
  );
}

function PriorityCard({
  items,
  role,
}: {
  items: PriorityItem[];
  role: DashboardData["role"];
}) {
  const [open, setOpen] = useState(false);
  const main = items[0];
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] border p-4 shadow-sm sm:p-5",
        role === "student" &&
          "border-orange-200/60 bg-gradient-to-br from-orange-50 via-card to-rose-50 dark:border-orange-900/50 dark:from-orange-950/40 dark:to-card",
        role === "teacher" &&
          "border-blue-200/60 bg-gradient-to-br from-blue-50 via-card to-cyan-50 dark:border-blue-900/50 dark:from-blue-950/35 dark:to-card",
        role === "parent" &&
          "border-stone-200/80 bg-gradient-to-br from-stone-50 via-card to-amber-50/60 dark:border-stone-800 dark:from-stone-950/50 dark:to-card",
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-primary/8 blur-2xl" />
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Bugün ve Öncelikler
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Şimdi ilgilenmen gerekenler
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="rounded-full">
              Tümü{" "}
              <span className="ml-1 rounded-full bg-foreground/8 px-1.5 py-0.5 text-[10px]">
                {items.length}
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tüm öncelikler</DialogTitle>
              <DialogDescription>Önem sırasına göre güncel listen.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="rounded-2xl border bg-card p-3">
                  <PriorityRow item={item} />
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-2xl bg-background/80 p-3.5 shadow-sm backdrop-blur-sm">
        <PriorityRow item={main} prominent />
      </div>
      {items.length > 1 && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {items.slice(1, 3).map((item) => (
            <div key={item.id} className="rounded-2xl border bg-background/55 p-3">
              <PriorityRow item={item} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function GoalDialog({ goal }: { goal: DailyGoalSummary }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [minutes, setMinutes] = useState(String(goal.minutesGoal ?? 60));
  const [questions, setQuestions] = useState(String(goal.questionsGoal ?? 80));
  function submit() {
    const form = new FormData();
    form.set("minutes", minutes);
    form.set("questions", questions);
    startTransition(async () => {
      try {
        await setDailyGoal(form);
        toast.success("Günlük hedefin güncellendi.");
        setOpen(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Hedef kaydedilemedi.");
      }
    });
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-full">
          <Target className="mr-1.5 h-4 w-4" /> Hedefi ayarla
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Günlük hedefim</DialogTitle>
          <DialogDescription>
            Her gün otomatik tekrarlanır; süre ve soru hedefi birlikte kullanılır.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2">
          {[
            [30, 40],
            [60, 80],
            [90, 120],
          ].map(([m, q]) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMinutes(String(m));
                setQuestions(String(q));
              }}
              className={cn(
                "min-h-14 rounded-xl border p-2 text-xs font-semibold",
                minutes === String(m) &&
                  questions === String(q) &&
                  "border-primary bg-primary/10 text-primary",
              )}
            >
              {m} dk
              <br />
              {q} soru
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="goal-minutes">Dakika</Label>
            <Input
              id="goal-minutes"
              type="number"
              min={1}
              max={1440}
              inputMode="numeric"
              value={minutes}
              onChange={(event) => setMinutes(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="goal-questions">Soru</Label>
            <Input
              id="goal-questions"
              type="number"
              min={1}
              max={2000}
              inputMode="numeric"
              value={questions}
              onChange={(event) => setQuestions(event.target.value)}
            />
          </div>
        </div>
        <Button disabled={pending} onClick={submit}>
          {pending ? "Kaydediliyor…" : "Hedefi kaydet"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function HomeworkAction({ item }: { item: HomeworkItem }) {
  const [pending, startTransition] = useTransition();
  function toggleHomework() {
    const form = new FormData();
    form.set("homework_id", item.id);
    form.set("done", String(!item.studentMarkedDone));
    startTransition(async () => {
      try {
        await setStudentHomeworkDone(form);
        toast.success(
          item.studentMarkedDone
            ? "Tamamlama beyanı geri alındı."
            : "Ödev tamamlandı olarak işaretlendi.",
        );
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "İşlem yapılamadı.");
      }
    });
  }
  if (item.tests?.length)
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            Testleri seç
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{item.title}</DialogTitle>
            <DialogDescription>
              Yaptığın testlere dokun; kontrol edilene kadar değiştirebilirsin.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-2">
            {item.tests.map((test) => (
              <StudentTestButton
                key={`${test.sectionId}-${test.testNumber}`}
                homeworkId={item.id}
                test={test}
                disabled={Boolean(item.checkedAt)}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  return (
    <Button
      size="sm"
      variant={item.studentMarkedDone ? "outline" : "default"}
      disabled={pending || Boolean(item.checkedAt)}
      onClick={toggleHomework}
    >
      {pending ? "…" : item.studentMarkedDone ? "Geri al" : "Tamamladım"}
    </Button>
  );
}

function StudentTestButton({
  homeworkId,
  test,
  disabled,
}: {
  homeworkId: string;
  test: NonNullable<HomeworkItem["tests"]>[number];
  disabled: boolean;
}) {
  const [marked, setMarked] = useState(test.studentMarked);
  const [pending, startTransition] = useTransition();
  function toggle() {
    const next = !marked;
    setMarked(next);
    const form = new FormData();
    form.set("homework_id", homeworkId);
    form.set("section_id", test.sectionId);
    form.set("test_number", String(test.testNumber));
    form.set("marked", String(next));
    startTransition(async () => {
      try {
        await setStudentTestMark(form);
      } catch (error) {
        setMarked(!next);
        toast.error(error instanceof Error ? error.message : "İşaretlenemedi.");
      }
    });
  }
  return (
    <button
      type="button"
      disabled={pending || disabled}
      onClick={toggle}
      className={cn(
        "min-h-11 rounded-xl border text-sm font-semibold transition-colors",
        marked && "border-primary bg-primary text-primary-foreground",
      )}
    >
      {test.testNumber}
    </button>
  );
}

function ScheduleAction({ item }: { item: ScheduleItem }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  function undo() {
    const form = new FormData();
    form.set("id", item.id);
    startTransition(async () => {
      try {
        await undoOwnScheduleCompletion(form);
        toast.success("Program tamamlaması geri alındı.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Geri alınamadı.");
      }
    });
  }
  if (item.completedAt)
    return item.canUndo ? (
      <Button size="sm" variant="outline" disabled={pending} onClick={undo}>
        <RotateCcw className="mr-1 h-3.5 w-3.5" />
        Geri al
      </Button>
    ) : (
      <span className="text-xs font-medium text-success">Tamamlandı</span>
    );
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Check className="mr-1 h-3.5 w-3.5" />
          Tamamla
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Çalışmayı günlüğe ekle</DialogTitle>
          <DialogDescription>
            {item.label} · {item.start}–{item.end}
          </DialogDescription>
        </DialogHeader>
        <form
          action={(form) =>
            startTransition(async () => {
              try {
                await completeOwnScheduleEntry(form);
                toast.success("Çalışma günlüğüne eklendi.");
                setOpen(false);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Kaydedilemedi.");
              }
            })
          }
          className="space-y-4"
        >
          <input type="hidden" name="id" value={item.id} />
          <div className="space-y-1.5">
            <Label htmlFor={`questions-${item.id}`}>Çözülen soru</Label>
            <Input
              id={`questions-${item.id}`}
              name="question_count"
              type="number"
              min={0}
              max={2000}
              inputMode="numeric"
              placeholder="Örn. 40"
            />
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Kaydediliyor…" : "Tamamla ve günlüğe aktar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed p-5 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function StudentSection({
  id,
  data,
}: {
  id: DashboardSectionId;
  data: StudentDashboardData;
}) {
  if (id === "today-flow")
    return (
      <div className="space-y-2">
        {data.todaySchedule.length ? (
          data.todaySchedule.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-2xl bg-muted/45 p-3"
            >
              <div className="w-12 text-center text-sm font-bold tabular-nums text-primary">
                {item.start}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.end}’e kadar</p>
              </div>
              <ScheduleAction item={item} />
            </div>
          ))
        ) : (
          <EmptyLine>Bugün programında çalışma yok.</EmptyLine>
        )}
      </div>
    );
  if (id === "homework-plan")
    return (
      <div className="space-y-2">
        {data.homework.length ? (
          data.homework.slice(0, 6).map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-2xl border p-3">
              <div
                className={cn(
                  "h-2.5 w-2.5 shrink-0 rounded-full",
                  item.status === "overdue" ? "bg-destructive" : "bg-warning",
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {item.dueDate
                    ? new Date(`${item.dueDate}T12:00:00`).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "short",
                      })
                    : "Tarih yok"}
                </p>
              </div>
              <HomeworkAction item={item} />
            </div>
          ))
        ) : (
          <EmptyLine>Bekleyen ödevin yok.</EmptyLine>
        )}
        <Button asChild variant="ghost" className="w-full">
          <Link href="/student/homework">
            Tüm ödevleri aç <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  if (id === "progress")
    return (
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-2xl font-bold">{data.studyStreak.current} gün</p>
            <p className="text-xs text-muted-foreground">
              Güncel seri · en iyi {data.studyStreak.best}
            </p>
          </div>
          <GoalDialog goal={data.goal} />
        </div>
        <GoalBars goal={data.goal} />
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-muted/45 p-3">
            <p className="text-xl font-bold">{data.studyStreak.weekDays}/7</p>
            <p className="text-xs text-muted-foreground">Bu hafta çalışılan gün</p>
          </div>
          <div className="rounded-2xl bg-muted/45 p-3">
            <p className="text-xl font-bold">{data.recentExams[0]?.totalNet ?? "—"}</p>
            <p className="text-xs text-muted-foreground">Son deneme neti</p>
          </div>
        </div>
      </div>
    );
  if (id === "pomodoro")
    return (
      <div className="h-64">
        <PomodoroWidget data={data} w={2} h={2} />
      </div>
    );
  if (id === "countdown")
    return (
      <div className="h-52">
        <CountdownWidget data={data} w={2} h={2} />
      </div>
    );
  return null;
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

function toScheduleEntry(item: ScheduleItem): StudyScheduleEntry {
  return {
    id: item.id,
    student_id: item.studentId ?? "",
    day_of_week: item.day,
    start_time: `${item.start}:00`,
    end_time: `${item.end}:00`,
    activity_label: item.label,
    subject: item.subject ?? null,
    kazanim_code: null,
    kazanim_name: null,
    week_start: currentWeekStart(),
    completed_at: item.completedAt ?? null,
    completion_log_id: null,
    updated_by: "",
    updated_at: "",
  };
}

function ParentSection({
  id,
  data,
}: {
  id: DashboardSectionId;
  data: ParentDashboardData;
}) {
  if (id === "weekly-story")
    return (
      <div className="space-y-3">
        {data.weeklyStory.map((story) => (
          <article
            key={story.studentId}
            className={cn(
              "rounded-2xl border p-4",
              story.studentId === data.selectedStudentId &&
                "border-primary/40 bg-primary/5",
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{story.studentName}</h3>
                <p className="text-xs text-muted-foreground">Bu haftanın kısa özeti</p>
              </div>
              <Sparkles className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              <strong className="text-foreground">{story.completedHomework} ödev</strong>{" "}
              tamamlandı,{" "}
              <strong className="text-foreground">{story.testsSolved} test</strong>{" "}
              çözüldü ve{" "}
              <strong className="text-foreground">{story.studyDays} gün</strong> çalışma
              kaydı girildi.{" "}
              {story.netChange === null
                ? "Net eğilimi için iki deneme gerekiyor."
                : story.netChange >= 0
                  ? `Son iki denemede ${story.netChange} net ilerleme var.`
                  : `Son iki denemede ${Math.abs(story.netChange)} net düşüş var.`}
            </p>
            <div className="mt-4">
              <GoalBars goal={story.goal} compact />
            </div>
          </article>
        ))}
      </div>
    );
  if (id === "upcoming")
    return (
      <div className="space-y-2">
        <div className="mb-3 flex justify-end">
          {data.selectedStudentId && (
            <AddScheduleEntryDialog
              studentId={data.selectedStudentId}
              redirectPath="/parent"
              weekStart={currentWeekStart()}
              entries={data.selectedSchedule.map(toScheduleEntry)}
            />
          )}
        </div>
        {data.selectedSchedule.slice(0, 5).map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded-2xl border p-3">
            <Clock3 className="h-4 w-4 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{item.label}</p>
              <p className="text-xs text-muted-foreground">
                {item.start}–{item.end}
              </p>
            </div>
            <AddScheduleEntryDialog
              studentId={data.selectedStudentId ?? undefined}
              redirectPath="/parent"
              weekStart={currentWeekStart()}
              entries={data.selectedSchedule.map(toScheduleEntry)}
              entry={toScheduleEntry(item)}
            />
          </div>
        ))}
        {data.selectedHomework.slice(0, 5).map((item) => (
          <Link
            key={item.id}
            href="/parent/homework"
            className="flex min-h-14 items-center gap-3 rounded-2xl border p-3"
          >
            <ClipboardCheck className="h-4 w-4 text-warning" />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">
              {item.title}
            </span>
            <span className="text-xs text-muted-foreground">{item.dueDate ?? "—"}</span>
          </Link>
        ))}
      </div>
    );
  if (id === "academic-progress")
    return (
      <div className="space-y-3">
        {data.children.find((child) => child.id === data.selectedStudentId) && (
          <GoalBars
            goal={
              data.children.find((child) => child.id === data.selectedStudentId)!.goal
            }
          />
        )}
        {data.selectedExams.length ? (
          data.selectedExams.map((exam, index) => (
            <div
              key={exam.id}
              className="flex items-center gap-3 rounded-2xl bg-muted/45 p-3"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{exam.name}</p>
                <p className="text-xs text-muted-foreground">{exam.date}</p>
              </div>
              <p className="text-lg font-bold tabular-nums">
                {exam.totalNet}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  net
                </span>
              </p>
            </div>
          ))
        ) : (
          <EmptyLine>Henüz deneme sonucu yok.</EmptyLine>
        )}
      </div>
    );
  return null;
}

function SectionCard({
  id,
  collapsed,
  data,
  onToggle,
}: {
  id: DashboardSectionId;
  collapsed: boolean;
  data: DashboardData;
  onToggle: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-[1.5rem] border bg-card shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-14 w-full items-center gap-3 px-4 text-left sm:px-5"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {id.includes("progress") || id === "student-radar" ? (
            <BarChart3 className="h-4 w-4" />
          ) : id.includes("calendar") || id.includes("flow") || id === "upcoming" ? (
            <CalendarDays className="h-4 w-4" />
          ) : id.includes("queue") || id.includes("homework") ? (
            <ListChecks className="h-4 w-4" />
          ) : id === "pomodoro" ? (
            <TimerReset className="h-4 w-4" />
          ) : id === "countdown" ? (
            <Target className="h-4 w-4" />
          ) : (
            <CircleGauge className="h-4 w-4" />
          )}
        </span>
        <h2 className="flex-1 text-sm font-semibold">{SECTION_TITLES[id]}</h2>
        {collapsed ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {!collapsed && (
        <div className="animate-in fade-in slide-in-from-top-1 px-4 pb-4 duration-200 motion-reduce:animate-none sm:px-5 sm:pb-5">
          {data.role === "student" ? (
            <StudentSection id={id} data={data} />
          ) : data.role === "teacher" ? (
            <TeacherSection id={id} data={data} />
          ) : (
            <ParentSection id={id} data={data} />
          )}
        </div>
      )}
    </section>
  );
}

function LayoutEditor({
  layout,
  onChange,
}: {
  layout: StoredLayoutV2;
  onChange: (layout: StoredLayoutV2) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(layout);
  const [pending, startTransition] = useTransition();
  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= draft.sections.length) return;
    const sections = [...draft.sections];
    [sections[index], sections[target]] = [sections[target], sections[index]];
    setDraft({ ...draft, sections });
  }
  function save() {
    startTransition(async () => {
      try {
        await saveDashboardLayout(draft);
        onChange(draft);
        toast.success("Ana sayfa düzeni kaydedildi.");
        setOpen(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Düzen kaydedilemedi.");
      }
    });
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft(layout);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full">
          <SlidersHorizontal className="mr-1.5 h-4 w-4" />
          Düzenle
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ana sayfayı düzenle</DialogTitle>
          <DialogDescription>
            Öncelikler kartı her zaman ilk sıradadır. Diğer bölümleri sırala, gizle veya
            daralt.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {draft.sections.map((section, index) => {
            const hidden = draft.hidden.includes(section.id);
            return (
              <div
                key={section.id}
                className="flex min-h-14 items-center gap-2 rounded-2xl border p-2"
              >
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      hidden: hidden
                        ? draft.hidden.filter((id) => id !== section.id)
                        : [...draft.hidden, section.id],
                    })
                  }
                  className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-accent"
                  aria-label={hidden ? "Göster" : "Gizle"}
                >
                  {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <span
                  className={cn(
                    "min-w-0 flex-1 text-sm font-medium",
                    hidden && "text-muted-foreground line-through",
                  )}
                >
                  {SECTION_TITLES[section.id]}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      sections: draft.sections.map((item) =>
                        item.id === section.id
                          ? { ...item, collapsed: !item.collapsed }
                          : item,
                      ),
                    })
                  }
                  className="h-9 rounded-lg px-2 text-xs text-muted-foreground hover:bg-accent"
                >
                  {section.collapsed ? "Daraltılmış" : "Açık"}
                </button>
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent disabled:opacity-30"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === draft.sections.length - 1}
                  className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent disabled:opacity-30"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
        <Button onClick={save} disabled={pending}>
          {pending ? "Kaydediliyor…" : "Düzeni kaydet"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function DashboardHomeClient({
  data,
  initialLayout,
}: {
  data: DashboardData;
  initialLayout: StoredLayoutV2;
}) {
  const [layout, setLayout] = useState(initialLayout);
  const [pending, startTransition] = useTransition();
  function toggleSection(id: DashboardSectionId) {
    const next = {
      ...layout,
      sections: layout.sections.map((section) =>
        section.id === id ? { ...section, collapsed: !section.collapsed } : section,
      ),
    };
    setLayout(next);
    startTransition(async () => {
      try {
        await saveDashboardLayout(next);
      } catch {
        toast.error("Bölüm durumu kaydedilemedi.");
      }
    });
  }
  function selectChild(id: string) {
    const next = { ...layout, selectedStudentId: id };
    setLayout(next);
    startTransition(async () => {
      try {
        await saveDashboardLayout(next);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Çocuk seçilemedi.");
      }
    });
  }
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-6xl space-y-4 pb-8",
        pending && "cursor-progress",
      )}
    >
      <header className="flex items-end justify-between gap-3 px-1">
        <div>
          <p className="text-xs font-medium capitalize text-muted-foreground">
            {data.todayLabel}
          </p>
          <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
            {data.role === "student"
              ? "Harika bir gün olsun"
              : data.role === "teacher"
                ? "Kontrol sende"
                : "Günün özeti hazır"}
            , {data.firstName}
          </h1>
        </div>
        <LayoutEditor layout={layout} onChange={setLayout} />
      </header>
      {data.role === "parent" && data.children.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-1 pb-1">
          {data.children.map((child) => (
            <button
              type="button"
              key={child.id}
              onClick={() => selectChild(child.id)}
              className={cn(
                "min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium",
                child.id === data.selectedStudentId
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card",
              )}
            >
              <span>{child.name}</span>
              {child.urgentCount > 0 && (
                <span className="ml-2 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] text-destructive-foreground">
                  {child.urgentCount}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      <PriorityCard items={data.priorities} role={data.role} />
      <div className="grid gap-3 lg:grid-cols-2">
        {layout.sections
          .filter((section) => !layout.hidden.includes(section.id))
          .map((section) => (
            <SectionCard
              key={section.id}
              id={section.id}
              collapsed={section.collapsed}
              data={data}
              onToggle={() => toggleSection(section.id)}
            />
          ))}
      </div>
    </div>
  );
}
