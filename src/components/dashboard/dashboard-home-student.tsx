"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowRight, Check, RotateCcw, Target } from "lucide-react";
import { toast } from "sonner";
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
import {
  DashboardHomeFrame,
  EmptyLine,
  GoalBars,
} from "@/components/dashboard/dashboard-home-shared";
import { setDailyGoal } from "@/lib/actions/dashboard";
import {
  completeOwnScheduleEntry,
  undoOwnScheduleCompletion,
} from "@/lib/actions/schedule";
import {
  setStudentHomeworkDone,
  setStudentTestMark,
} from "@/app/student/homework/actions";
import { cn } from "@/lib/utils";
import type {
  DashboardSectionId,
  DailyGoalSummary,
  HomeworkItem,
  ScheduleItem,
  StoredLayoutV2,
  StudentDashboardData,
} from "@/lib/dashboard-types";

/** Öğrenci dashboard'u: yalnız öğrenci rolüne inen client chunk. */
export function DashboardHomeStudent({
  data,
  initialLayout,
}: {
  data: StudentDashboardData;
  initialLayout: StoredLayoutV2;
}) {
  return (
    <DashboardHomeFrame
      data={data}
      initialLayout={initialLayout}
      renderSection={(id) => <StudentSection id={id} data={data} />}
    />
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
