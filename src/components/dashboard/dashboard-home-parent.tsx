"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ClipboardCheck, Clock3, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DashboardHomeFrame,
  EmptyLine,
  GoalBars,
} from "@/components/dashboard/dashboard-home-shared";
import { currentWeekStart } from "@/lib/week";
import { cn } from "@/lib/utils";
import type {
  DashboardSectionId,
  ParentDashboardData,
  ScheduleItem,
  StoredLayoutV2,
} from "@/lib/dashboard-types";
import type { StudyScheduleEntry } from "@/lib/types";

// Ağır program diyaloğu ayrı chunk'ta kalır; bölüm gizliyse hiç yüklenmez.
const AddScheduleEntryDialog = dynamic(
  () =>
    import("@/components/schedule/add-schedule-entry-dialog").then(
      (m) => m.AddScheduleEntryDialog,
    ),
  { loading: () => <Skeleton className="h-9 w-9 rounded-md" /> },
);

/** Veli dashboard'u: yalnız veli rolüne inen client chunk. */
export function DashboardHomeParent({
  data,
  initialLayout,
}: {
  data: ParentDashboardData;
  initialLayout: StoredLayoutV2;
}) {
  return (
    <DashboardHomeFrame
      data={data}
      initialLayout={initialLayout}
      renderSection={(id) => <ParentSection id={id} data={data} />}
    />
  );
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
