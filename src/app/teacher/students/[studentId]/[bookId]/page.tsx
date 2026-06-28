import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { TestGrid } from "@/components/resources/test-grid";
import { getStudentProgressForBook } from "@/lib/books";

export default async function TeacherStudentBookProgressPage({
  params,
}: {
  params: Promise<{ studentId: string; bookId: string }>;
}) {
  const { studentId, bookId } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", studentId)
    .single();
  if (!student) notFound();

  const data = await getStudentProgressForBook(studentId, bookId);
  if (!data) notFound();

  const { book, sections, completedBySection, totalTests, completedCount } = data;
  const percent = totalTests === 0 ? 0 : Math.round((completedCount / totalTests) * 100);
  const redirectPath = `/teacher/students/${studentId}/${bookId}`;

  return (
    <>
      <PageHeader
        title={book.name}
        description={`${student.full_name} · ${completedCount} / ${totalTests} test (%${percent})`}
        action={
          <Link
            href={`/teacher/students/${studentId}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            ← {student.full_name}
          </Link>
        }
      />

      {sections.length === 0 ? (
        <EmptyState title="Bu kitap için henüz bölüm tanımlı değil" />
      ) : (
        <div className="space-y-3">
          {sections.map((s) => {
            const done = completedBySection.get(s.id) ?? new Set<number>();
            return (
              <Card key={s.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-medium">{s.name}</h3>
                    <span className="text-xs text-muted-foreground">
                      {done.size} / {s.test_count}
                    </span>
                  </div>
                  <TestGrid
                    studentId={studentId}
                    sectionId={s.id}
                    testCount={s.test_count}
                    completed={done}
                    redirectPath={redirectPath}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
