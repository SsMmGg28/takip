import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { AddBookDialog } from "@/components/resources/add-book-dialog";
import { getStudentBookOverview } from "@/lib/books";

export default async function StudentResourcesPage() {
  const profile = await requireRole(["student"]);
  const books = await getStudentBookOverview(profile.id);

  return (
    <>
      <PageHeader
        title="Kaynaklarım"
        description="Kataloğun tamamı. Bir kitabı aç, çözdüğün testleri işaretle."
        action={<AddBookDialog role="student" />}
      />

      {books.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Katalogda henüz kitap yok"
          description="Öğretmen kitap ekleyince burada görünecek."
        />
      ) : (
        <div className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((b) => {
            const percent =
              b.totalTests === 0
                ? 0
                : Math.round((b.completedCount / b.totalTests) * 100);
            return (
              <Link key={b.id} href={`/student/resources/${b.id}`} className="block">
                <Card className="group h-full transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent/40 hover:shadow-md">
                  <CardContent className="flex h-full flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{b.name}</p>
                        {b.subject && (
                          <p className="text-xs text-muted-foreground">{b.subject}</p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {b.completedCount} / {b.totalTests} test
                        </span>
                        <span>%{percent}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                    <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                      <Badge variant="outline">{b.sections.length} bölüm</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
