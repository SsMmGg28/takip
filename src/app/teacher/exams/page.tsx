import { Inbox, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StudentPickerGrid } from "@/components/student-picker-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewRequestButtons } from "@/components/exams/exam-actions";
import { getPendingEditRequests } from "@/lib/exams";
import { withGrades } from "@/lib/students";
import { examsEnabledForGrade } from "@/lib/kazanim";
import type { Profile } from "@/lib/types";

export default async function TeacherExamsOverviewPage() {
  const supabase = await createClient();
  const { data: students } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .order("full_name");

  const withGrade = await withGrades((students as Profile[]) ?? []);
  // Deneme takibi yalnızca 7. ve 8. sınıflar için aktif.
  const eligible = withGrade.filter((s) => examsEnabledForGrade(s.grade_level));
  const pendingRequests = await getPendingEditRequests();

  return (
    <>
      <PageHeader
        title="Deneme Analizi"
        description="Deneme girmek veya analiz görmek için bir öğrenci seç (7. ve 8. sınıflar)."
      />

      {pendingRequests.length > 0 && (
        <Card className="animate-fade-up border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="gradient-surface flex h-8 w-8 items-center justify-center rounded-lg text-white">
                <Inbox className="h-4 w-4" />
              </span>
              Bekleyen Düzenleme Talepleri
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {request.examName}{" "}
                    <span className="font-normal text-muted-foreground">
                      ({request.examDate}) — {request.studentName}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Talep eden veli: {request.parentName}
                    {request.reason && ` — "${request.reason}"`}
                  </p>
                </div>
                <ReviewRequestButtons requestId={request.id} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {eligible.length ? (
        <StudentPickerGrid
          students={eligible}
          hrefPrefix="/teacher/exams"
          ctaLabel="Denemeleri görüntüle"
        />
      ) : (
        <EmptyState
          icon={Users}
          title="Uygun öğrenci yok"
          description="Deneme takibi 7. ve 8. sınıf öğrencileri için aktiftir."
        />
      )}
    </>
  );
}
