import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { TestGrid } from "@/components/resources/test-grid";
import { getStudentProgressForBook } from "@/lib/books";

export default async function StudentBookPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const profile = await requireRole(["student"]);
  const { bookId } = await params;
  const data = await getStudentProgressForBook(profile.id, bookId);
  if (!data) notFound();

  const { book, sections, completedBySection, totalTests, completedCount } = data;
  const percent = totalTests === 0 ? 0 : Math.round((completedCount / totalTests) * 100);
  const redirectPath = `/student/resources/${bookId}`;

  return (
    <>
      <PageHeader
        title={book.name}
        description={`${book.subject ?? "Genel"} · ${completedCount} / ${totalTests} test tamam (%${percent})`}
        action={
          <Link href="/student/resources" className="text-sm text-muted-foreground hover:underline">
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
                    studentId={profile.id}
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
