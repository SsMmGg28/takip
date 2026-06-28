import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { getStudentBookOverview } from "@/lib/books";

export default async function TeacherStudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", studentId)
    .single();
  if (!student) notFound();

  const books = await getStudentBookOverview(studentId);

  return (
    <>
      <PageHeader
        title={student.full_name}
        description="Bu öğrencinin kataloğdaki tüm kitaplardaki ilerlemesi."
        action={
          <Link href="/teacher/students" className="text-sm text-muted-foreground hover:underline">
            ← Öğrenciler
          </Link>
        }
      />

      {books.length === 0 ? (
        <EmptyState icon={BookOpen} title="Katalogda henüz kitap yok" />
      ) : (
        <div className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((b) => {
            const percent =
              b.totalTests === 0
                ? 0
                : Math.round((b.completedCount / b.totalTests) * 100);
            return (
              <Link
                key={b.id}
                href={`/teacher/students/${studentId}/${b.id}`}
                className="block"
              >
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
