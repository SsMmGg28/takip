import Link from "next/link";
import { notFound } from "next/navigation";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { SectionManager } from "@/components/resources/section-manager";
import { DeleteBookButton } from "@/components/resources/delete-book-button";
import { BookApprovalActions } from "@/components/resources/book-approval-actions";
import { updateBook } from "@/lib/actions/resources";
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
        description={`${book.subject ?? "Genel"} · ${sectionList.length} bölüm · ${totalTests} test`}
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
          Kitap Bilgileri
        </h2>
        <form
          action={updateBook}
          className="flex flex-wrap items-end gap-3 rounded-2xl border bg-muted/30 p-4"
        >
          <input type="hidden" name="id" value={book.id} />
          <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
            <label htmlFor="book-name" className="text-sm font-medium">
              Kitap adı
            </label>
            <Input
              id="book-name"
              name="name"
              defaultValue={book.name}
              required
              className="bg-background"
            />
          </div>
          <div className="flex w-44 flex-col gap-1.5">
            <label htmlFor="book-subject" className="text-sm font-medium">
              Ders
            </label>
            <Input
              id="book-subject"
              name="subject"
              defaultValue={book.subject ?? ""}
              placeholder="Genel"
              className="bg-background"
            />
          </div>
          <Button type="submit" variant="outline">
            Kaydet
          </Button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Bölümler
        </h2>
        <SectionManager bookId={book.id} sections={sectionList} />
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
