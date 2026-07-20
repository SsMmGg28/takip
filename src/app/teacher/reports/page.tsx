import { Bug } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { BugReportStatusButton } from "@/components/teacher/bug-report-status-button";
import { cn } from "@/lib/utils";
import type { BugReport } from "@/lib/types";

export const metadata = { title: "Raporlar" };

const ROLE_LABELS: Record<string, string> = {
  teacher: "Öğretmen",
  student: "Öğrenci",
  parent: "Veli",
};

export default async function TeacherReportsPage() {
  await requireRole(["teacher"]);
  const supabase = await createClient();

  const { data: reports } = await supabase
    .from("bug_reports")
    .select("*")
    .order("created_at", { ascending: false });
  const list = (reports as BugReport[] | null) ?? [];

  const reporterIds = Array.from(new Set(list.map((r) => r.reporter_id)));
  const { data: reporters } = reporterIds.length
    ? await supabase.from("profiles").select("id, full_name, role").in("id", reporterIds)
    : { data: [] };
  const reporterById = new Map((reporters ?? []).map((p) => [p.id, p]));

  const openReports = list.filter((r) => r.status === "open");
  const resolvedReports = list.filter((r) => r.status === "resolved");

  function ReportCard({ report }: { report: BugReport }) {
    const reporter = reporterById.get(report.reporter_id);
    return (
      <div
        className={cn(
          "rounded-2xl border bg-card p-4 shadow-sm",
          report.status === "resolved" && "opacity-70",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{reporter?.full_name ?? "Silinmiş kullanıcı"}</p>
              {reporter && (
                <Badge variant="outline">
                  {ROLE_LABELS[reporter.role] ?? reporter.role}
                </Badge>
              )}
              <Badge variant={report.status === "open" ? "destructive" : "secondary"}>
                {report.status === "open" ? "Açık" : "Çözüldü"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(report.created_at).toLocaleString("tr-TR", {
                day: "2-digit",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
              {report.page ? ` · Sayfa: ${report.page}` : ""}
            </p>
          </div>
          <BugReportStatusButton reportId={report.id} status={report.status} />
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm">{report.description}</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Hata Bildirimleri"
        description="Kullanıcıların ilettiği sorunlar; çözünce işaretle."
      />

      {list.length === 0 ? (
        <EmptyState
          icon={Bug}
          title="Henüz hata bildirimi yok"
          description="Kullanıcılar profil sayfalarındaki 'Hata Bildir' düğmesiyle sorun iletebilir."
        />
      ) : (
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Açık ({openReports.length})
            </h2>
            {openReports.length === 0 ? (
              <p className="text-sm text-muted-foreground">Açık bildirim yok. 🎉</p>
            ) : (
              <div className="stagger space-y-3">
                {openReports.map((r) => (
                  <ReportCard key={r.id} report={r} />
                ))}
              </div>
            )}
          </section>

          {resolvedReports.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Çözülen ({resolvedReports.length})
              </h2>
              <div className="space-y-3">
                {resolvedReports.map((r) => (
                  <ReportCard key={r.id} report={r} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}
