import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { WeakTopic } from "@/lib/exam-analysis";

export function WeakTopicsTable({ topics }: { topics: WeakTopic[] }) {
  const weakest = topics.slice(0, 10);

  if (weakest.length === 0) {
    return (
      <p className="rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">
        Henüz konu bazlı veri girilmedi.
      </p>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ders</TableHead>
              <TableHead>Konu</TableHead>
              <TableHead>Doğru</TableHead>
              <TableHead>Yanlış</TableHead>
              <TableHead>Boş</TableHead>
              <TableHead>Başarı</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weakest.map((t) => (
              <TableRow key={`${t.subject}-${t.topic}`}>
                <TableCell>{t.subject}</TableCell>
                <TableCell className="font-medium">{t.topic}</TableCell>
                <TableCell>{t.correct}</TableCell>
                <TableCell>{t.incorrect}</TableCell>
                <TableCell>{t.blank}</TableCell>
                <TableCell>
                  <Badge variant={t.accuracy < 50 ? "outline" : "default"}>
                    %{t.accuracy}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-2 sm:hidden">
        {weakest.map((t) => (
          <div
            key={`${t.subject}-${t.topic}`}
            className="rounded-md border p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{t.subject}</p>
                <p className="font-medium">{t.topic}</p>
              </div>
              <Badge
                variant={t.accuracy < 50 ? "outline" : "default"}
                className="shrink-0"
              >
                %{t.accuracy}
              </Badge>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded bg-muted/50 p-1.5 text-center">
                <p className="text-muted-foreground">Doğru</p>
                <p className="font-semibold">{t.correct}</p>
              </div>
              <div className="rounded bg-muted/50 p-1.5 text-center">
                <p className="text-muted-foreground">Yanlış</p>
                <p className="font-semibold">{t.incorrect}</p>
              </div>
              <div className="rounded bg-muted/50 p-1.5 text-center">
                <p className="text-muted-foreground">Boş</p>
                <p className="font-semibold">{t.blank}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
