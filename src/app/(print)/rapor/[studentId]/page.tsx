import { notFound } from "next/navigation";
import { getStudentReport } from "@/lib/report";
import { ReportControls } from "@/components/report/report-controls";
import { todayInIstanbul } from "@/lib/week";

export const metadata = { title: "Öğrenci Raporu" };

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const FLOOR = "2015-01-01";

function fmt(ymd: string): string {
  return new Date(`${ymd}T00:00:00Z`).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function fmtShort(ymd: string): string {
  return new Date(`${ymd}T00:00:00Z`).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    timeZone: "UTC",
  });
}

const HW_LABELS: Record<string, string> = {
  completed: "Tamamlanan",
  incomplete: "Eksik",
  overdue: "Geciken",
  assigned: "Bekleyen",
};

export default async function StudentReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { studentId } = await params;
  const sp = await searchParams;

  const fromRaw = sp.from && YMD.test(sp.from) ? sp.from : "";
  const toRaw = sp.to && YMD.test(sp.to) ? sp.to : "";
  const from = fromRaw || FLOOR;
  const to = toRaw || todayInIstanbul();

  const report = await getStudentReport(studentId, { from, to });
  if (!report) notFound();

  const rangeLabel = `${fromRaw ? fmt(from) : "başlangıç"} – ${fmt(to)}`;

  return (
    <>
      <ReportControls studentId={studentId} from={fromRaw} to={toRaw} />

      <article className="report-body flex flex-col gap-6 text-foreground">
        {/* Başlık */}
        <header className="border-b pb-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Dönem Raporu
          </p>
          <h1 className="mt-1 text-2xl font-bold">{report.student.fullName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {report.student.grade ? `${report.student.grade}. sınıf · ` : ""}
            {rangeLabel}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Oluşturulma: {fmt(todayInIstanbul())}
          </p>
        </header>

        {/* Özet kutuları */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Deneme", value: report.examCount },
            {
              label: "Ort. Puan",
              value: report.avgScore ?? "—",
              hint: report.targetScore ? `hedef ${report.targetScore}` : undefined,
            },
            { label: "Ort. Net", value: report.avgNet ?? "—" },
            {
              label: "Hedefe",
              value:
                report.projection.gapToTarget == null
                  ? "—"
                  : report.projection.gapToTarget <= 0
                    ? "ulaşıldı"
                    : `${report.projection.gapToTarget} puan`,
              hint:
                report.projection.netNeeded != null
                  ? `~${report.projection.netNeeded} net`
                  : undefined,
            },
          ].map((tile) => (
            <div key={tile.label} className="rounded-xl border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">{tile.label}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{tile.value}</p>
              {tile.hint && (
                <p className="text-[11px] text-muted-foreground">{tile.hint}</p>
              )}
            </div>
          ))}
        </section>

        {/* Denemeler */}
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">Denemeler</h2>
          {report.exams.length === 0 ? (
            <p className="text-sm text-muted-foreground">Bu aralıkta deneme yok.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="py-1.5 pr-2">Tarih</th>
                    <th className="py-1.5 pr-2">Deneme</th>
                    <th className="py-1.5 pr-2 text-right">Puan</th>
                    <th className="py-1.5 text-right">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {report.exams.slice(0, 15).map((e) => (
                    <tr key={e.id} className="border-b last:border-0">
                      <td className="py-1.5 pr-2 tabular-nums text-muted-foreground">
                        {fmtShort(e.date)}
                      </td>
                      <td className="py-1.5 pr-2">{e.name}</td>
                      <td className="py-1.5 pr-2 text-right tabular-nums">
                        {e.score ?? "—"}
                      </td>
                      <td className="py-1.5 text-right tabular-nums">{e.totalNet}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* En zayıf kazanımlar */}
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">En Zayıf Kazanımlar</h2>
          {report.weakest.length === 0 ? (
            <p className="text-sm text-muted-foreground">Kazanım verisi yok.</p>
          ) : (
            <ol className="flex flex-col gap-1.5">
              {report.weakest.map((k, i) => (
                <li
                  key={`${k.subject}-${k.code}`}
                  className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-1.5"
                >
                  <span className="w-5 shrink-0 text-center text-xs font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-sm font-medium">{k.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {k.subject}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    %{k.wrongRate} yanlış · {k.asked} soru
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Kitaplık + Ödev durumu */}
        <div className="grid gap-6 sm:grid-cols-2">
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold">Kitaplık İlerlemesi</h2>
            {report.books.length === 0 ? (
              <p className="text-sm text-muted-foreground">Kitaplık boş.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {report.books.map((b) => {
                  const pct = b.total > 0 ? Math.round((b.done / b.total) * 100) : 0;
                  return (
                    <li
                      key={b.name}
                      className="rounded-lg border bg-muted/30 px-3 py-1.5"
                    >
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="min-w-0 truncate font-medium">{b.name}</span>
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                          {b.done}/{b.total} · %{pct}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold">Ödev Durumu</h2>
            <p className="text-xs text-muted-foreground">
              Bu aralıkta teslim tarihli {report.homework.total} ödev.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(["completed", "incomplete", "overdue", "assigned"] as const).map((st) => (
                <div
                  key={st}
                  className="rounded-lg border bg-muted/30 px-3 py-2 text-center"
                >
                  <p className="text-lg font-bold tabular-nums">
                    {report.homework.byStatus[st]}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{HW_LABELS[st]}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </article>
    </>
  );
}
