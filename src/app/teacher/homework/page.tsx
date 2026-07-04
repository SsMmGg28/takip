import Link from "next/link";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Hourglass,
  Paperclip,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import { CreateHomeworkDialog } from "@/components/teacher/create-homework-dialog";
import { DeleteHomeworkGroupButton } from "@/components/teacher/homework-row-actions";
import { HOMEWORK_STATUS_LABEL } from "@/components/homework/homework-status-badge";
import { getApprovedBooks } from "@/lib/books";
import { getAssignmentGroups } from "@/lib/homework-fetch";
import { cn } from "@/lib/utils";
import type { HomeworkStatus, Profile } from "@/lib/types";

const CHIP_CLASS: Record<HomeworkStatus, string> = {
  assigned: "border-input bg-background text-foreground hover:bg-accent",
  completed: "border-success/40 bg-success/10 text-success hover:bg-success/20",
  incomplete: "border-warning/40 bg-warning/10 text-warning hover:bg-warning/20",
  overdue: "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20",
};

const DOT_CLASS: Record<HomeworkStatus, string> = {
  assigned: "bg-muted-foreground",
  completed: "bg-success",
  incomplete: "bg-warning",
  overdue: "bg-destructive",
};

export default async function TeacherHomeworkPage() {
  await requireRole(["teacher"]);
  const supabase = await createClient();

  const [{ data: students }, books, groups] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "student").order("full_name"),
    getApprovedBooks(),
    getAssignmentGroups(),
  ]);

  const studentList = (students as Profile[] | null) ?? [];
  const studentOptions = studentList.map((s) => ({ id: s.id, fullName: s.full_name }));
  const bookOptions = books.map((b) => ({
    id: b.id,
    name: b.name,
    subject: b.subject,
    sections: b.sections.map((s) => ({
      id: s.id,
      name: s.name,
      testCount: s.test_count,
    })),
  }));

  const allEntries = groups.flatMap((g) => g.entries);
  const waitingCheck = allEntries.filter((e) => e.homework.status === "assigned").length;
  const incompleteCount = allEntries.filter(
    (e) => e.homework.status === "incomplete",
  ).length;
  const completedCount = allEntries.filter(
    (e) => e.homework.status === "completed",
  ).length;

  return (
    <>
      <PageHeader
        title="Ödev Merkezi"
        description="Öğrencileri seç, aynı ödevi hepsine tek seferde gönder; kontrolü öğrenci öğrenci yap."
        action={
          <CreateHomeworkDialog students={studentOptions} books={bookOptions} />
        }
      />

      {studentList.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Henüz öğrenci yok"
          description={
            <>
              Önce{" "}
              <Link href="/teacher/students" className="underline">
                Öğrenciler
              </Link>{" "}
              sayfasından öğrenci ekle.
            </>
          }
        />
      ) : (
        <>
          <div className="stagger grid gap-3 sm:grid-cols-3">
            <StatCard label="Kontrol Bekleyen" value={waitingCheck} icon={Hourglass} />
            <StatCard label="Eksik" value={incompleteCount} icon={AlertTriangle} />
            <StatCard label="Tamamlanan" value={completedCount} icon={CheckCircle2} />
          </div>

          {groups.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Henüz ödev gönderilmedi"
              description="“Yeni Ödev Gönder” ile başla: öğrencileri seç, testleri işaretle, tek tıkla hepsine gitsin."
            />
          ) : (
            <div className="stagger space-y-3">
              {groups.map((g) => (
                <div key={g.groupId} className="rounded-2xl border bg-card p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                      <p className="font-semibold leading-tight">{g.title}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          {new Date(g.createdAt).toLocaleDateString("tr-TR")} gönderildi
                        </span>
                        {g.dueDate && (
                          <span>
                            Teslim: {new Date(g.dueDate).toLocaleDateString("tr-TR")}
                          </span>
                        )}
                        {g.book && (
                          <span className="inline-flex items-center gap-1">
                            <BookOpen className="h-3.5 w-3.5" /> {g.book.name}
                          </span>
                        )}
                        {g.attachmentName && (
                          <span className="inline-flex items-center gap-1">
                            <Paperclip className="h-3.5 w-3.5" /> {g.attachmentName}
                          </span>
                        )}
                      </div>
                    </div>
                    <DeleteHomeworkGroupButton
                      groupId={g.groupId}
                      studentCount={g.entries.length}
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {g.entries.map(({ homework, student }) => (
                      <Link
                        key={homework.id}
                        href={`/teacher/homework/${homework.student_id}`}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all hover:-translate-y-0.5 active:translate-y-0",
                          CHIP_CLASS[homework.status],
                        )}
                        title={`${student?.full_name ?? "?"} — ${HOMEWORK_STATUS_LABEL[homework.status]}`}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            DOT_CLASS[homework.status],
                          )}
                        />
                        {student?.full_name ?? "?"}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <section className="space-y-3">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Öğrenciye Göre
            </h2>
            <div className="stagger flex flex-wrap gap-1.5">
              {studentList.map((s) => (
                <Link
                  key={s.id}
                  href={`/teacher/homework/${s.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-input bg-background px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground"
                >
                  {s.full_name}
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}
