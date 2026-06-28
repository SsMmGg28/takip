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

  return (
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
              <Badge variant={t.accuracy < 50 ? "outline" : "default"}>%{t.accuracy}</Badge>
            </TableCell>
          </TableRow>
        ))}
        {weakest.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              Henüz konu bazlı veri girilmedi.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
