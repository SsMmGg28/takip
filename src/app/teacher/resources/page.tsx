import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { AddBookDialog } from "@/components/resources/add-book-dialog";
import type { ResourceBook } from "@/lib/types";

export default async function TeacherResourcesPage() {
  const supabase = await createClient();

  const { data: books } = await supabase
    .from("resource_books")
    .select("*")
    .eq("approved", true)
    .order("name");

  const { data: sectionCounts } = await supabase
    .from("resource_book_sections")
    .select("book_id, test_count");

  const totalsByBook = new Map<string, { sections: number; tests: number }>();
  for (const s of sectionCounts ?? []) {
    const t = totalsByBook.get(s.book_id) ?? { sections: 0, tests: 0 };
    t.sections += 1;
    t.tests += s.test_count;
    totalsByBook.set(s.book_id, t);
  }

  const { count: pendingRequestCount } = await supabase
    .from("book_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  return (
    <>
      <PageHeader
        title="Kaynak Kitap Kataloğu"
        description="Tüm öğrencilerin ortak kullandığı kitap kataloğu. Her kitap için bölüm ve test sayılarını girersin, öğrenciler çözdükçe işaretler."
        action={<AddBookDialog role="teacher" />}
      />

      {(pendingRequestCount ?? 0) > 0 && (
        <Link
          href="/teacher/book-requests"
          className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm transition-colors hover:bg-primary/10"
        >
          <span>
            <span className="font-medium">{pendingRequestCount}</span> öğrenciden gelen kitap
            isteği bekliyor.
          </span>
          <span className="font-medium">İncele →</span>
        </Link>
      )}

      {books?.length ? (
        <div className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(books as ResourceBook[]).map((b) => {
            const t = totalsByBook.get(b.id) ?? { sections: 0, tests: 0 };
            return (
              <Link key={b.id} href={`/teacher/resources/${b.id}`} className="block">
                <Card className="group h-full transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent/40 hover:shadow-md">
                  <CardContent className="flex h-full flex-col gap-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{b.name}</p>
                        {b.subject && (
                          <p className="text-xs text-muted-foreground">{b.subject}</p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <div className="mt-auto flex flex-wrap gap-2 pt-2">
                      <Badge variant="outline">{t.sections} bölüm</Badge>
                      <Badge variant="outline">{t.tests} test</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="Henüz kitap eklenmedi"
          description="Yukarıdaki “Yeni Kitap Ekle” ile başla."
        />
      )}
    </>
  );
}
