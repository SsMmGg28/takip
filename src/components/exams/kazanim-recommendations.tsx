import { BookOpen, Lightbulb, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/resources/star-rating";
import {
  CreateHomeworkDialog,
  type HomeworkBookOption,
  type HomeworkStudentOption,
} from "@/components/teacher/create-homework-dialog";
import type { KazanimRecommendation } from "@/lib/exams/recommendations";

/**
 * Öğretmen: bir öğrencinin zayıf kazanımları için önerilen (çözülmemiş, uygun
 * zorlukta) kitap bölümleri. Her kart tek tıkla ödev formunu önden doldurur.
 */
export function KazanimRecommendations({
  recommendations,
  studentId,
  books,
  students,
}: {
  recommendations: KazanimRecommendation[];
  studentId: string;
  books: HomeworkBookOption[];
  students: HomeworkStudentOption[];
}) {
  const actionable = recommendations.filter((r) => r.book && r.section);
  const noBook = recommendations.filter((r) => !r.book);
  if (recommendations.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Çalışma Önerileri</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        En çok yanlış/boş yapılan kazanımlar için, öğrencinin başarısına uygun zorlukta ve
        henüz çözülmemiş kitap bölümleri. Başarı yüksekse daha zor, düşükse daha kolay
        kitap önerilir.
      </p>

      {actionable.length > 0 ? (
        <div className="stagger grid gap-3">
          {actionable.map((r) => (
            <div
              key={`${r.subject}-${r.code}`}
              className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="shrink-0">
                    {r.subject}
                  </Badge>
                  <span className="font-medium">{r.name}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Target className="h-3.5 w-3.5" />
                    Başarı %{Math.round(r.successRate * 100)} · {r.asked} soru
                  </span>
                  <span
                    className={
                      r.status === "unsolved"
                        ? "rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary"
                        : "rounded-full bg-warning/10 px-2 py-0.5 font-medium text-foreground"
                    }
                  >
                    {r.status === "unsolved" ? "çözülmemiş" : "yarım kalmış"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="font-medium">{r.book!.name}</span>
                  <span className="text-muted-foreground">— {r.section!.name}</span>
                  {typeof r.difficulty === "number" && r.difficulty > 0 ? (
                    <StarRating value={r.difficulty} />
                  ) : (
                    <span className="text-xs text-muted-foreground">(derece yok)</span>
                  )}
                </div>
                {r.suggestedTests.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Önerilen test{r.suggestedTests.length > 1 ? "ler" : ""}:{" "}
                    <span className="font-medium text-foreground">
                      {r.suggestedTests.join(", ")}
                    </span>
                  </p>
                )}
              </div>
              <div className="shrink-0">
                <CreateHomeworkDialog
                  students={students}
                  books={books}
                  defaultStudentIds={[studentId]}
                  defaultBookId={r.book!.id}
                  defaultTests={r.suggestedTests.map((n) => ({
                    sectionId: r.section!.id,
                    testNumber: n,
                  }))}
                  triggerLabel="Ödev olarak ata"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
          Zayıf kazanımlar var ama kütüphanede bu sınıfa uygun, henüz çözülmemiş kitap
          bulunamadı. Kütüphaneye uygun kitap ekleyip zorluk derecesi verirsen burada
          öneri çıkar.
        </div>
      )}

      {actionable.length > 0 && noBook.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Kütüphanede uygun kitabı olmayan zayıf kazanımlar:{" "}
          {noBook.map((r) => r.name).join(", ")}.
        </p>
      )}
    </section>
  );
}
