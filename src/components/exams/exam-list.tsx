import Link from "next/link";
import { ChevronRight, LineChart, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { calculateNet, type ExamWithSubjects } from "@/lib/exam-analysis";
import type { ExamEditRequest } from "@/lib/types";
import {
  DeleteExamButton,
  EditRequestStatusBadge,
  RequestEditButton,
} from "@/components/exams/exam-actions";

function formatDate(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Geçmiş denemeler listesi. role:
 * - teacher: düzenle + sil
 * - parent: talep akışı (talep yok → talep gönder; onaylı → düzenle/sil)
 * - student: yalnızca görüntüleme
 */
export function ExamList({
  exams,
  detailHrefPrefix,
  role,
  editRequests = [],
}: {
  exams: ExamWithSubjects[];
  detailHrefPrefix: string;
  role: "teacher" | "parent" | "student";
  editRequests?: ExamEditRequest[];
}) {
  if (exams.length === 0) {
    return (
      <EmptyState
        icon={LineChart}
        title="Henüz deneme yok"
        description="İlk deneme sonucu girildiğinde burada listelenir."
      />
    );
  }

  return (
    <div className="stagger flex flex-col gap-3">
      {exams.map((exam) => {
        const request = editRequests.find(
          (r) => r.exam_id === exam.id && r.status !== "used" && r.status !== "rejected",
        );
        const rejected = editRequests.find(
          (r) => r.exam_id === exam.id && r.status === "rejected",
        );
        const canMutate =
          role === "teacher" || (role === "parent" && request?.status === "approved");

        return (
          <Card key={exam.id} className="hover-lift group relative overflow-hidden transition-colors hover:border-primary/40">
            {/* Kartın tamamı detaya gider; sağdaki aksiyon düğmeleri z-10 ile üstte kalır. */}
            <Link
              href={`${detailHrefPrefix}/${exam.id}`}
              aria-label={`${exam.exam_name} detayına git`}
              className="absolute inset-0"
            />
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2 font-semibold group-hover:text-primary">
                  <span className="truncate">{exam.exam_name}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </span>
                <div className="relative z-10 flex items-center gap-2">
                  {role === "parent" && request && (
                    <EditRequestStatusBadge status={request.status} />
                  )}
                  {role === "parent" && !request && rejected && (
                    <EditRequestStatusBadge status="rejected" />
                  )}
                  {canMutate && (
                    <>
                      <Button variant="ghost" size="icon-sm" asChild aria-label="Denemeyi düzenle">
                        <Link href={`${detailHrefPrefix}/${exam.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteExamButton examId={exam.id} />
                    </>
                  )}
                  {role === "parent" && !request && (
                    <RequestEditButton examId={exam.id} />
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span>{formatDate(exam.exam_date)}</span>
                {exam.score != null && (
                  <span className="font-medium text-foreground tabular-nums">
                    Puan: {exam.score}
                  </span>
                )}
                <span className="tabular-nums">Toplam Net: {exam.totalNet}</span>
              </div>

              {exam.subjects.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {exam.subjects.map((s) => (
                    <span
                      key={s.id}
                      className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground tabular-nums"
                    >
                      {s.subject_name}:{" "}
                      <span className="font-semibold">
                        {calculateNet(s.correct_count, s.incorrect_count)}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
