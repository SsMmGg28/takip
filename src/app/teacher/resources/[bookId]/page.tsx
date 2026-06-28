import Link from "next/link";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { SectionForm } from "@/components/resources/section-form";
import { deleteBookSection, deleteBook } from "@/lib/actions/resources";
import type { ResourceBookSection } from "@/lib/types";

export default async function TeacherBookDetailPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;
  const supabase = await createClient();

  const { data: book } = await supabase
    .from("resource_books")
    .select("*")
    .eq("id", bookId)
    .single();
  if (!book) notFound();

  const { data: sections } = await supabase
    .from("resource_book_sections")
    .select("*")
    .eq("book_id", bookId)
    .order("order_index", { ascending: true });

  const nextOrder = (sections?.length ?? 0) + 1;
  const totalTests = (sections ?? []).reduce((acc, s) => acc + s.test_count, 0);

  return (
    <>
      <PageHeader
        title={book.name}
        description={`${book.subject ?? "Genel"} · ${sections?.length ?? 0} bölüm · ${totalTests} test`}
        action={
          <div className="flex items-center gap-2">
            <Link href="/teacher/resources" className="text-sm text-muted-foreground hover:underline">
              ← Kataloga dön
            </Link>
            <form action={deleteBook}>
              <input type="hidden" name="id" value={book.id} />
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Kitabı Sil
              </Button>
            </form>
          </div>
        }
      />

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Yeni Bölüm
        </h2>
        <SectionForm bookId={bookId} nextOrder={nextOrder} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Bölümler
        </h2>
        {sections?.length ? (
          <div className="space-y-2">
            {(sections as ResourceBookSection[]).map((s, i) => (
              <Card key={s.id}>
                <CardContent className="flex items-center justify-between gap-3 p-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.test_count} test</p>
                    </div>
                  </div>
                  <form action={deleteBookSection}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="book_id" value={bookId} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Bölümü sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Henüz bölüm eklenmedi"
            description="Yukarıdaki forma bölüm adı ve test sayısı girerek başla."
          />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Öğrenci İlerlemesi
        </h2>
        <p className="text-sm text-muted-foreground">
          Bir öğrencinin bu kitaptaki ilerlemesini görmek için{" "}
          <Link href="/teacher/students" className="underline">
            Öğrenciler
          </Link>{" "}
          sayfasından ilgili öğrenciye git.
        </p>
      </section>
    </>
  );
}
