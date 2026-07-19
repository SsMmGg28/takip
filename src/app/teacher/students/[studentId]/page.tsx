import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpen,
  CalendarClock,
  ClipboardList,
  FileText,
  Flame,
  GraduationCap,
  LineChart,
  Trophy,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookCard } from "@/components/resources/book-card";
import { HomeworkStatusBadge } from "@/components/homework/homework-status-badge";
import { SubjectFilterCharts } from "@/components/exams/subject-filter-charts";
import { AutoRepeatToggle } from "@/components/schedule/schedule-toolbar-buttons";
import { StudentNotesCard } from "@/components/teacher/student-notes-card";
import { StudyLogSummaryCard } from "@/components/study-log/study-log-summary-card";
import { getStudentShelf } from "@/lib/books";
import { getStudentStudySummary } from "@/lib/study-log-fetch";
import { getExamOverview, getKazanimAnalysis } from "@/lib/exam-analysis";
import { effectiveHomeworkStatus } from "@/lib/homework";
import { examsEnabledForGrade } from "@/lib/kazanim";
import type { Homework } from "@/lib/types";

export default async function TeacherStudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  await requireRole(["teacher"]);
  const { studentId } = await params;
  const supabase = await createClient();

  // Beş bağımsız sorgu tek dalgada (öğrenci profili dahil).
  const [{ data: student }, { data: studentProfile }, shelf, { data: homeworkRows }, studySummary] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", studentId).single(),
      supabase
        .from("student_profiles")
        .select("grade_level, notes, target_score, schedule_auto_repeat")
        .eq("id", studentId)
        .single(),
      getStudentShelf(studentId),
      supabase
        .from("homework")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(20),
      getStudentStudySummary(studentId),
    ]);
  if (!student) notFound();

  const homework = ((homeworkRows as Homework[]) ?? []).map((h) => ({
    ...h,
    effectiveStatus: effectiveHomeworkStatus(h),
  }));
  const recentHomework = homework.slice(0, 5);
  const problemHomework = homework.filter(
    (h) => h.effectiveStatus === "incomplete" || h.effectiveStatus === "overdue",
  );

  const grade = studentProfile?.grade_level ?? null;
  const examsEnabled = examsEnabledForGrade(grade);
  const [overview, analysis] = examsEnabled
    ? await Promise.all([getExamOverview(studentId), getKazanimAnalysis(studentId)])
    : [null, null];

  const examCount = overview?.exams.length ?? 0;
  const avgScore =
    overview && examCount > 0
      ? Math.round(
          (overview.exams.reduce((sum, e) => sum + (e.score ?? 0), 0) / examCount) * 10,
        ) / 10
      : null;
  const avgNet =
    overview && examCount > 0
      ? Math.round((overview.exams.reduce((sum, e) => sum + e.totalNet, 0) / examCount) * 10) /
        10
      : null;
  const weakTopics = analysis?.priorities.slice(0, 5) ?? [];

  function HomeworkRow({ hw }: { hw: (typeof homework)[number] }) {
    return (
      <li>
        <Link
          href={`/teacher/homework/${studentId}`}
          className="flex items-center gap-2 rounded-xl border bg-muted/30 px-3 py-2 transition-colors hover:bg-accent/60"
        >
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{hw.title}</span>
          {hw.due_date && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {new Date(hw.due_date + "T00:00:00").toLocaleDateString("tr-TR")}
            </span>
          )}
          <HomeworkStatusBadge status={hw.effectiveStatus} />
        </Link>
      </li>
    );
  }

  return (
    <>
      <PageHeader
        title={student.full_name}
        description={`${grade ? `${grade}. sınıf — ` : ""}ödev, deneme ve kitap ilerlemesinin tek ekran özeti.`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/teacher/students"
              className="text-sm text-muted-foreground hover:underline"
            >
              ← Öğrenciler
            </Link>
            <Link
              href={`/teacher/schedule/${studentId}`}
              className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-sm shadow-sm transition-colors hover:bg-accent"
            >
              <CalendarClock className="h-4 w-4" />
              Çalışma Programı
            </Link>
            <Link
              href={`/rapor/${studentId}`}
              className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-sm shadow-sm transition-colors hover:bg-accent"
            >
              <FileText className="h-4 w-4" />
              Rapor
            </Link>
          </div>
        }
      />

      {/* Deneme özeti (yalnız 7-8. sınıf) */}
      {examsEnabled && overview && (
        <>
          <div className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Deneme Sayısı"
              value={examCount}
              icon={GraduationCap}
              href={`/teacher/exams/${studentId}`}
            />
            <StatCard
              label="Ortalama Puan"
              value={avgScore ?? "—"}
              icon={Trophy}
              hint={studentProfile?.target_score ? `hedef: ${studentProfile.target_score}` : undefined}
              href={`/teacher/exams/${studentId}`}
            />
            <StatCard
              label="Ortalama Net"
              value={avgNet ?? "—"}
              icon={LineChart}
              href={`/teacher/exams/${studentId}`}
            />
            <StatCard
              label="Son Deneme"
              value={overview.exams[0]?.totalNet ?? "—"}
              hint={overview.exams[0]?.exam_name}
              icon={ClipboardList}
              href={`/teacher/exams/${studentId}`}
            />
          </div>

          <SubjectFilterCharts
            rows={overview.chartRows}
            subjects={overview.subjects}
            targetScore={studentProfile?.target_score}
          />

          {/* Sistemin analiz ettiği en zayıf konular */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="gradient-surface flex h-8 w-8 items-center justify-center rounded-lg text-white">
                  <Flame className="h-4 w-4" />
                </span>
                En Zayıf Konular
                <span className="text-xs font-normal text-muted-foreground">
                  (son 10 deneme + soru sıklığına göre)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weakTopics.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Kazanım verisi yok; deneme girerken kazanım işaretlenirse bu liste dolar.
                </p>
              ) : (
                <ol className="stagger flex flex-col gap-2">
                  {weakTopics.map((p, index) => (
                    <li
                      key={`${p.subject}-${p.code}`}
                      className="flex items-center gap-3 rounded-xl border bg-muted/30 px-3 py-2.5"
                    >
                      <span className="gradient-surface flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.subject}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        %{p.wrongRate} yanlış
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Ödevler */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="gradient-surface flex h-8 w-8 items-center justify-center rounded-lg text-white">
                <ClipboardList className="h-4 w-4" />
              </span>
              Son Ödevler
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentHomework.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz ödev gönderilmedi.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {recentHomework.map((hw) => (
                  <HomeworkRow key={hw.id} hw={hw} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="gradient-surface flex h-8 w-8 items-center justify-center rounded-lg text-white">
                <ClipboardList className="h-4 w-4" />
              </span>
              Eksik / Geciken Ödevler
              <span className="text-xs font-normal text-muted-foreground">
                ({problemHomework.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {problemHomework.length === 0 ? (
              <p className="text-sm text-muted-foreground">Eksik veya geciken ödev yok. 🎉</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {problemHomework.slice(0, 5).map((hw) => (
                  <HomeworkRow key={hw.id} hw={hw} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <AutoRepeatToggle
          studentId={studentId}
          initialEnabled={Boolean(studentProfile?.schedule_auto_repeat)}
        />
      </div>

      <StudyLogSummaryCard summary={studySummary} />

      <StudentNotesCard studentId={studentId} initialNotes={studentProfile?.notes ?? null} />

      {/* Kitaplık */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          Kitaplık ve Test İlerlemesi
        </h2>
        {shelf.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Kitaplığı henüz boş"
            description="Velisi kütüphaneden kitap eklediğinde burada ilerlemesiyle görünecek."
          />
        ) : (
          <div className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shelf.map((b) => (
              <BookCard
                key={b.id}
                href={`/teacher/students/${studentId}/${b.id}`}
                name={b.name}
                subject={b.subject}
                sectionCount={b.sections.length}
                testCount={b.totalTests}
                completedCount={b.completedCount}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
