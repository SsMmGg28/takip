import Link from "next/link";
import { BookOpen, Clock } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getStudyBreakdown } from "@/lib/study-log-fetch";

export default async function StudyBreakdownPage() {
  const profile = await requireRole(["student"]);
  const rows = await getStudyBreakdown(profile.id);

  // Ders bazında grupla; her ders kartında toplam dk/soru başlıkta, altında konu satırları.
  const bySubject = new Map<string, typeof rows>();
  for (const r of rows) {
    if (!bySubject.has(r.subject)) bySubject.set(r.subject, []);
    bySubject.get(r.subject)!.push(r);
  }
  const subjects = Array.from(bySubject.entries())
    .map(([subject, items]) => ({
      subject,
      items,
      totalMinutes: items.reduce((s, r) => s + r.minutes, 0),
      totalQuestions: items.reduce((s, r) => s + r.questions, 0),
    }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes);

  const grandMinutes = rows.reduce((s, r) => s + r.minutes, 0);
  const grandQuestions = rows.reduce((s, r) => s + r.questions, 0);

  return (
    <>
      <PageHeader
        title="Ders & Konu Dökümü"
        description="Bugüne kadar hangi dersten/konudan ne kadar çalıştığını ve kaç soru çözdüğünü gösterir."
        action={
          <Link
            href="/student/gunluk"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Çalışma Günlüğü
          </Link>
        }
      />

      {subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Henüz kayıt yok"
          description="Çalışma günlüğüne kayıt ekledikçe burada ders ve konu bazlı dökümün oluşur."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Toplam Süre</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{grandMinutes} dk</p>
            </div>
            <div className="rounded-xl border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Toplam Soru</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{grandQuestions}</p>
            </div>
            <div className="rounded-xl border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Ders Sayısı</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{subjects.length}</p>
            </div>
          </div>

          <div className="stagger flex flex-col gap-4">
            {subjects.map((s) => (
              <Card key={s.subject}>
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                    {s.subject}
                    <span className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {s.totalMinutes} dk · {s.totalQuestions} soru
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Konu</TableHead>
                          <TableHead className="text-center">Süre</TableHead>
                          <TableHead className="text-center">Soru</TableHead>
                          <TableHead className="text-center">Oturum</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {s.items.map((r) => (
                          <TableRow key={`${r.subject}-${r.topic ?? "genel"}`}>
                            <TableCell className="font-medium">
                              {r.topic ?? "Genel çalışma"}
                            </TableCell>
                            <TableCell className="text-center tabular-nums">
                              {r.minutes} dk
                            </TableCell>
                            <TableCell className="text-center tabular-nums">
                              {r.questions || "—"}
                            </TableCell>
                            <TableCell className="text-center tabular-nums">
                              {r.sessions}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </>
  );
}
