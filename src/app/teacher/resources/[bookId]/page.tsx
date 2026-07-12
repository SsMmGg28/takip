import Link from "next/link";
import { notFound } from "next/navigation";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { BookEditor } from "@/components/resources/book-editor";
import { DeleteBookButton } from "@/components/resources/delete-book-button";
import { BookApprovalActions } from "@/components/resources/book-approval-actions";
import { getBookStudents } from "@/lib/books";
import type { ResourceBook, ResourceBookSection } from "@/lib/types";

export default async function TeacherBookDetailPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  await requireRole(["teacher"]);
  const { bookId } = await params;
  const supabase = await createClient();

  const { data: bookRow } = await supabase
    .from("resource_books")
    .select("*")
    .eq("id", bookId)
    .single();
  if (!bookRow) notFound();
  const book = bookRow as ResourceBook;

  const { data: sections } = await supabase
    .from("resource_book_sections")
    .select("*")
    .eq("book_id", bookId)
    .order("order_index", { ascending: true });

  const sectionList = (sections as ResourceBookSection[]) ?? [];
  const totalTests = sectionList.reduce((acc, s) => acc + s.test_count, 0);
  const students = book.approved ? await getBookStudents(bookId) : [];

  return (
    <>
      <PageHeader
        title={book.name}
        description={`${book.grade_level ? `${book.grade_level}. sınıf · ` : ""}${book.subject ?? "Genel"} · ${sectionList.length} bölüm · ${totalTests} test`}
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/teacher/resources"
              className="text-sm text-muted-foreground hover:underline"
            >
              ← Kütüphane
            </Link>
            <DeleteBookButton bookId={book.id} bookName={book.name} />
          </div>
        }
      />

      {!book.approved && (
        <div className="animate-scale-in flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warning/40 bg-warning/5 p-4">
          <p className="text-sm">
            Bu kitap bir veli tarafından eklendi ve <strong>onayını bekliyor</strong>.
            İçeriği aşağıdan düzenleyip onaylayabilirsin.
          </p>
          <BookApprovalActions bookId={book.id} bookName={book.name} />
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Kitap Bilgileri &amp; Bölümler
        </h2>
        <BookEditor
          bookId={book.id}
          initialName={book.name}
          initialGrade={book.grade_level}
          initialSubject={book.subject ?? ""}
          initialDifficulty={book.difficulty}
          initialSections={sectionList.map((s) => ({
            name: s.name,
            testCount: s.test_count,
            kazanimCode: s.kazanim_code,
          }))}
        />
      </section>

      {book.approved && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Bu Kitabı Kullanan Öğrenciler
          </h2>
          {students.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Henüz kimsenin kitaplığında yok"
              description="Veliler bu kitabı çocuklarının kitaplığına eklediğinde burada ilerlemeleriyle listelenir."
            />
          ) : (
            <div className="stagger grid gap-3 sm:grid-cols-2">
              {students.map(({ student, completedCount }) => {
                const percent =
                  totalTests === 0 ? 0 : Math.round((completedCount / totalTests) * 100);
                return (
                  <Link
                    key={student.id}
                    href={`/teacher/students/${student.id}/${book.id}`}
                    className="hover-lift block rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{student.full_name}</p>
                      <span className="text-sm font-semibold text-primary">
                        %{percent}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                      <span>
                        {completedCount} / {totalTests} test
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="gradient-surface h-full rounded-full transition-all duration-700"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}
    </>
  );
}
