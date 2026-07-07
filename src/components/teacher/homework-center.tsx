"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Paperclip,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import {
  HOMEWORK_STATUS_LABEL,
  HomeworkStatusBadge,
} from "@/components/homework/homework-status-badge";
import { CheckHomeworkDialog } from "@/components/teacher/check-homework-dialog";
import { EditHomeworkDialog } from "@/components/teacher/edit-homework-dialog";
import {
  DeleteHomeworkGroupButton,
  ReassignMissingButton,
} from "@/components/teacher/homework-row-actions";
import type { HomeworkBookOption } from "@/components/teacher/create-homework-dialog";
import { effectiveHomeworkStatus } from "@/lib/homework";
import { cn } from "@/lib/utils";
import type { HomeworkStatus } from "@/lib/types";

export interface CenterTest {
  sectionId: string;
  sectionName: string;
  testNumber: number;
  completed: boolean;
  studentMarked: boolean;
}

export interface CenterEntry {
  homeworkId: string;
  studentId: string;
  studentName: string;
  status: HomeworkStatus;
  dueDate: string | null;
  checked: boolean;
  feedback: string | null;
  studentSaysDone: boolean;
  tests: CenterTest[];
}

export interface CenterGroup {
  groupId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  createdAt: string;
  attachmentName: string | null;
  bookName: string | null;
  /** Grup düzenleme diyaloğu için kitap içeriği (bölümler + test sayıları). */
  book: HomeworkBookOption | null;
  /** "sectionId:testNumber" — grup düzenlemede mevcut test seçimi. */
  initialTests: string[];
  entries: CenterEntry[];
}

type StatusFilter = "all" | HomeworkStatus;

const FILTER_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "assigned", label: HOMEWORK_STATUS_LABEL.assigned },
  { value: "overdue", label: HOMEWORK_STATUS_LABEL.overdue },
  { value: "incomplete", label: HOMEWORK_STATUS_LABEL.incomplete },
  { value: "completed", label: HOMEWORK_STATUS_LABEL.completed },
];

function entryStatus(e: CenterEntry): HomeworkStatus {
  return effectiveHomeworkStatus({ status: e.status, due_date: e.dueDate });
}

/** Öğrencinin beyanının kısa özeti (kontrol öncesi bilgi). */
function claimLabel(e: CenterEntry): string | null {
  if (e.checked) return null;
  if (e.tests.length > 0) {
    const marked = e.tests.filter((t) => t.studentMarked).length;
    return marked > 0 ? `${marked}/${e.tests.length} işaretledi` : null;
  }
  return e.studentSaysDone ? "tamamladım dedi" : null;
}

/**
 * Öğretmen ödev merkezi: durum sekmeleri + öğrenci filtresi + arama;
 * kontrol, düzenleme ve eksik gönderimi sayfa değiştirmeden yapılır.
 */
export function HomeworkCenter({
  groups,
  students,
}: {
  groups: CenterGroup[];
  students: { id: string; fullName: string }[];
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [studentFilter, setStudentFilter] = useState("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const all = groups.flatMap((g) => g.entries);
    const byStatus = new Map<StatusFilter, number>([["all", all.length]]);
    for (const e of all) {
      const s = entryStatus(e);
      byStatus.set(s, (byStatus.get(s) ?? 0) + 1);
    }
    return byStatus;
  }, [groups]);

  const visibleGroups = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    return groups
      .filter((g) => !q || g.title.toLocaleLowerCase("tr-TR").includes(q))
      .map((g) => ({
        ...g,
        visibleEntries: g.entries.filter(
          (e) =>
            (studentFilter === "all" || e.studentId === studentFilter) &&
            (statusFilter === "all" || entryStatus(e) === statusFilter),
        ),
      }))
      .filter((g) => g.visibleEntries.length > 0);
  }, [groups, query, statusFilter, studentFilter]);

  return (
    <div className="flex flex-col gap-4">
      {/* Filtre çubuğu */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTER_TABS.map((tab) => {
            const count = counts.get(tab.value) ?? 0;
            const active = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
                  active
                    ? "gradient-surface border-transparent text-white shadow-md shadow-primary/25"
                    : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-xs tabular-nums",
                    active ? "bg-white/20" : "bg-muted",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-48 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ödev başlığında ara..."
              className="pl-9"
            />
          </div>
          <Select value={studentFilter} onValueChange={setStudentFilter}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm öğrenciler</SelectItem>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {visibleGroups.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Bu filtrelerle eşleşen ödev yok"
          description="Filtreleri temizle veya yeni ödev gönder."
        />
      ) : (
        <div className="stagger flex flex-col gap-3">
          {visibleGroups.map((g) => {
            const checkedCount = g.entries.filter((e) => e.checked).length;
            const progress =
              g.entries.length > 0
                ? Math.round((checkedCount / g.entries.length) * 100)
                : 0;
            return (
              <div key={g.groupId} className="rounded-2xl border bg-card p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold leading-tight">{g.title}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        {new Date(g.createdAt).toLocaleDateString("tr-TR")} gönderildi
                      </span>
                      {g.dueDate && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          Teslim: {new Date(g.dueDate + "T00:00:00").toLocaleDateString("tr-TR")}
                        </span>
                      )}
                      {g.bookName && (
                        <span className="inline-flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" /> {g.bookName}
                        </span>
                      )}
                      {g.attachmentName && (
                        <span className="inline-flex items-center gap-1">
                          <Paperclip className="h-3.5 w-3.5" /> {g.attachmentName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <EditHomeworkDialog
                      homeworkId={g.entries[0]?.homeworkId ?? ""}
                      initialTitle={g.title}
                      initialDescription={g.description}
                      initialDueDate={g.dueDate}
                      book={g.book}
                      initialTests={g.initialTests}
                      groupSize={g.entries.length}
                    />
                    <DeleteHomeworkGroupButton
                      groupId={g.groupId}
                      studentCount={g.entries.length}
                    />
                  </div>
                </div>

                {/* Kontrol ilerlemesi */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {checkedCount}/{g.entries.length} öğrenci kontrol edildi
                    </span>
                    <span className="font-medium text-foreground">%{progress}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        progress >= 100 ? "bg-success" : "gradient-surface",
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Öğrenci satırları */}
                <ul className="mt-3 flex flex-col gap-1.5">
                  {g.visibleEntries.map((e) => {
                    const status = entryStatus(e);
                    const claim = claimLabel(e);
                    const missingCount = e.tests.filter((t) => !t.completed).length;
                    return (
                      <li
                        key={e.homeworkId}
                        className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/30 px-3 py-2"
                      >
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {e.studentName}
                        </span>
                        {claim && (
                          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                            {claim}
                          </span>
                        )}
                        <HomeworkStatusBadge status={status} />
                        <div className="flex shrink-0 items-center gap-1.5">
                          <CheckHomeworkDialog
                            homeworkId={e.homeworkId}
                            homeworkTitle={g.title}
                            studentName={e.studentName}
                            tests={e.tests.map((t) => ({
                              sectionId: t.sectionId,
                              sectionName: t.sectionName,
                              testNumber: t.testNumber,
                              completed: t.completed,
                              studentMarked: t.studentMarked,
                            }))}
                            checkedBefore={e.checked}
                            studentSaysDone={e.studentSaysDone}
                            initialFeedback={e.feedback}
                          />
                          {status === "incomplete" && missingCount > 0 && e.tests.length > 0 && (
                            <ReassignMissingButton
                              homeworkId={e.homeworkId}
                              missingCount={missingCount}
                            />
                          )}
                          <Link
                            href={`/teacher/homework/${e.studentId}`}
                            className="inline-flex items-center gap-0.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                          >
                            Detay
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
