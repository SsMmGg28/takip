import Link from "next/link";
import { BarChart3, Flame, CalendarCheck, Clock } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudyLogForm } from "@/components/study-log/study-log-form";
import { StudyLogList } from "@/components/study-log/study-log-list";
import { getStudentStudySummary } from "@/lib/study-log-fetch";
import { addDays } from "@/lib/study-log";
import { todayInIstanbul } from "@/lib/week";
import { getStudentGrade } from "@/lib/students";
import { getBookSubjects, getBookUnits } from "@/lib/book-catalog";
import { LGS_SUBJECTS } from "@/lib/kazanim";

export default async function StudentJournalPage() {
  const profile = await requireRole(["student"]);
  const [summary, grade] = await Promise.all([
    getStudentStudySummary(profile.id),
    getStudentGrade(profile.id),
  ]);

  const catalogSubjects = getBookSubjects(grade ?? 0);
  const base = catalogSubjects.length > 0 ? catalogSubjects : LGS_SUBJECTS.map((s) => s.name);
  const subjects = [...base, "Diğer"];
  const topicsBySubject = Object.fromEntries(
    catalogSubjects.map((s) => [s, getBookUnits(grade ?? 0, s)]),
  );

  const today = todayInIstanbul();
  const yesterday = addDays(today, -1);
  const maxSubjectMinutes = Math.max(1, ...summary.week.bySubject.map((s) => s.minutes));

  return (
    <>
      <PageHeader
        title="Çalışma Günlüğü"
        description="Her gün ne çalıştığını kaydet; serini büyüt. Düzenli çalışan kazanır! 🔥"
        action={
          <Link
            href="/student/gunluk/dokum"
            className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-sm shadow-sm transition-colors hover:bg-accent"
          >
            <BarChart3 className="h-4 w-4" />
            Ders & Konu Dökümü
          </Link>
        }
      />

      {/* Seri + bu hafta özeti */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-1 py-6 text-center">
            <span className="gradient-surface flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg shadow-primary/25">
              <Flame className="h-7 w-7" />
            </span>
            <p className="mt-2 text-4xl font-bold tabular-nums">{summary.current}</p>
            <p className="text-sm text-muted-foreground">günlük seri</p>
            <p className="mt-1 text-xs text-muted-foreground">En iyi: {summary.best} gün</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarCheck className="h-4 w-4 text-primary" />
              Bu Hafta
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="inline-flex items-center gap-1.5">
                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                <strong className="tabular-nums">{summary.week.days}</strong> / 7 gün
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <strong className="tabular-nums">{summary.week.minutes}</strong> dk toplam
              </span>
              <span className="text-muted-foreground">Bugün: {summary.todayMinutes} dk</span>
            </div>
            {summary.week.bySubject.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {summary.week.bySubject.map((s) => (
                  <div key={s.subject} className="flex items-center gap-2 text-xs">
                    <span className="w-28 shrink-0 truncate text-muted-foreground">
                      {s.subject}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="gradient-surface h-full rounded-full"
                        style={{ width: `${Math.round((s.minutes / maxSubjectMinutes) * 100)}%` }}
                      />
                    </div>
                    <span className="w-12 shrink-0 text-right tabular-nums">{s.minutes} dk</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Bu hafta henüz kayıt yok. İlk çalışmanı ekle!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bugün ne çalıştın? */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Bugün ne çalıştın?
        </h2>
        <StudyLogForm subjects={subjects} topicsBySubject={topicsBySubject} />
      </section>

      {/* Son kayıtlar */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Son Kayıtlar
        </h2>
        <StudyLogList logs={summary.recent} today={today} yesterday={yesterday} />
      </section>
    </>
  );
}
