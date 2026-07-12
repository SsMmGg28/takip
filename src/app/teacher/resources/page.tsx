import { BookOpen, Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { AddBookDialog } from "@/components/resources/add-book-dialog";
import { BookCard } from "@/components/resources/book-card";
import { BookFilters } from "@/components/resources/book-filters";
import { BookApprovalActions } from "@/components/resources/book-approval-actions";
import { getApprovedBooks, getPendingBooks } from "@/lib/books";
import type { Profile } from "@/lib/types";

export default async function TeacherResourcesPage() {
  await requireRole(["teacher"]);
  const supabase = await createClient();

  const [approved, pending] = await Promise.all([getApprovedBooks(), getPendingBooks()]);

  const creatorIds = Array.from(new Set(pending.map((b) => b.created_by)));
  const { data: creators } = creatorIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", creatorIds)
    : { data: [] };
  const creatorById = new Map(
    ((creators as Pick<Profile, "id" | "full_name">[] | null) ?? []).map((p) => [
      p.id,
      p.full_name,
    ]),
  );

  return (
    <>
      <PageHeader
        title="Kütüphane"
        description="Ortak kaynak kitap kütüphanesi. Velilerin eklediği kitaplar burada onayını bekler; onaylı kitaplar velilerce öğrencilerin kitaplığına atanır."
        action={<AddBookDialog role="teacher" />}
      />

      {pending.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping-soft absolute h-2 w-2 rounded-full bg-warning" />
              <span className="h-2 w-2 rounded-full bg-warning" />
            </span>
            Onay Bekleyenler ({pending.length})
          </h2>
          <div className="stagger space-y-2">
            {pending.map((b) => (
              <div
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warning/40 bg-warning/5 p-4"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
                    <BookOpen className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold leading-tight">{b.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {b.grade_level ? `${b.grade_level}. sınıf · ` : ""}
                      {b.subject ?? "Genel"} · {b.sections.length} bölüm · {b.totalTests}{" "}
                      test
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Ekleyen: {creatorById.get(b.created_by) ?? "?"} ·{" "}
                      {new Date(b.created_at).toLocaleDateString("tr-TR")}
                    </p>
                    {b.sections.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {b.sections.slice(0, 6).map((s) => (
                          <Badge key={s.id} variant="secondary" className="text-[10px]">
                            {s.name} · {s.test_count}
                          </Badge>
                        ))}
                        {b.sections.length > 6 && (
                          <Badge variant="secondary" className="text-[10px]">
                            +{b.sections.length - 6}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <BookApprovalActions bookId={b.id} bookName={b.name} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Kütüphane ({approved.length})
        </h2>
        {approved.length ? (
          <BookFilters
            books={approved.map((b) => ({
              id: b.id,
              grade: b.grade_level,
              subject: b.subject,
              node: (
                <BookCard
                  href={`/teacher/resources/${b.id}`}
                  name={b.name}
                  subject={b.subject}
                  grade={b.grade_level}
                  difficulty={b.difficulty}
                  sectionCount={b.sections.length}
                  testCount={b.totalTests}
                />
              ),
            }))}
          />
        ) : (
          <EmptyState
            icon={Inbox}
            title="Kütüphane boş"
            description="“Kitap Ekle” ile ilk kaynağı sen ekle; veliler de kitap ekleyebilir, onların ekledikleri senin onayından geçer."
          />
        )}
      </section>
    </>
  );
}
