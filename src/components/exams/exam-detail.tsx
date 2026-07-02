import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { calculateNet, type ExamWithSubjects } from "@/lib/exam-analysis";
import type { ExamKazanimResult } from "@/lib/types";

/** Tek denemenin ders ve kazanım ayrıntıları (salt okunur görünüm). */
export function ExamDetail({
  exam,
  kazanimResults,
}: {
  exam: ExamWithSubjects;
  kazanimResults: ExamKazanimResult[];
}) {
  return (
    <div className="stagger flex flex-col gap-4">
      {/* Özet şerit */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Tarih</p>
            <p className="mt-1 font-semibold">
              {new Date(exam.exam_date + "T00:00:00").toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Puan</p>
            <p className="gradient-text mt-1 text-xl font-bold tabular-nums">
              {exam.score ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Toplam Net</p>
            <p className="mt-1 text-xl font-bold tabular-nums">{exam.totalNet}</p>
          </CardContent>
        </Card>
      </div>

      {/* Ders kartları */}
      {exam.subjects.map((subject) => {
        const kazanimlar = kazanimResults.filter(
          (k) => k.exam_subject_id === subject.id,
        );
        return (
          <Card key={subject.id}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
                <span>{subject.subject_name}</span>
                <span className="flex items-center gap-2 text-xs font-normal">
                  <Badge variant="secondary" className="tabular-nums">
                    D {subject.correct_count}
                  </Badge>
                  <Badge variant="secondary" className="tabular-nums">
                    Y {subject.incorrect_count}
                  </Badge>
                  <Badge variant="secondary" className="tabular-nums">
                    B {subject.blank_count}
                  </Badge>
                  <Badge className="tabular-nums">
                    Net {calculateNet(subject.correct_count, subject.incorrect_count)}
                  </Badge>
                </span>
              </CardTitle>
            </CardHeader>
            {kazanimlar.length > 0 && (
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kazanım</TableHead>
                      <TableHead className="text-center">Doğru</TableHead>
                      <TableHead className="text-center">Yanlış</TableHead>
                      <TableHead className="text-center">Boş</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kazanimlar.map((k) => (
                      <TableRow key={k.id}>
                        <TableCell className="font-medium">{k.kazanim_name}</TableCell>
                        <TableCell className="text-center tabular-nums">
                          {k.correct_count}
                        </TableCell>
                        <TableCell className="text-center tabular-nums">
                          {k.incorrect_count}
                        </TableCell>
                        <TableCell className="text-center tabular-nums">
                          {k.blank_count}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
