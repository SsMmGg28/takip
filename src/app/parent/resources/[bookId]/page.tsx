import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getAccessibleStudents } from "@/lib/students";
import { getStudentProgressForBook } from "@/lib/books";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { TestGrid } from "@/components/resources/test-grid";

export const metadata = { title: "Kitap Detayı" };

export default async function ParentBookProgressPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookId: string }>;
  searchParams: Promise<{ student?: string }>;
}) {
  const profile = await requireRole(["parent"]);
  const { bookId } = await params;
  const { student: requestedStudentId } = await searchParams;

  const students = await getAccessibleStudents(profile);
  if (students.length === 0) redirect("/parent/resources");

  const activeStudent = students.find((s) => s.id === requestedStudentId) ?? students[0];

  const data = await getStudentProgressForBook(activeStudent.id, bookId);
  if (!data) notFound();

  const { book, sections, completedBySection, totalTests, completedCount } = data;
  const percent = totalTests === 0 ? 0 : Math.round((completedCount / totalTests) * 100);

  return (
    <>
      <PageHeader
        title={book.name}
        description={`${activeStudent.full_name} · ${completedCount} / ${totalTests} test (%${percent})`}
        action={
          <Link
            href={`/parent/resources?student=${activeStudent.id}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Tüm kitaplar
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
                    studentId={activeStudent.id}
                    sectionId={s.id}
                    testCount={s.test_count}
                    completed={done}
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
