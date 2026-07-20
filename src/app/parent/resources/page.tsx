import Link from "next/link";
import { BookOpen, Clock3, Library } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getAccessibleStudentsWithGrades } from "@/lib/students";
import { getApprovedBooks, getPendingBooks, getStudentShelf } from "@/lib/books";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { AddBookDialog } from "@/components/resources/add-book-dialog";
import { BookCard } from "@/components/resources/book-card";
import { BookFilters } from "@/components/resources/book-filters";
import {
  AddToShelfButton,
  RemoveFromShelfButton,
  WithdrawPendingBookButton,
} from "@/components/resources/shelf-actions";
import { cn } from "@/lib/utils";

export default async function ParentResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const profile = await requireRole(["parent"]);
  const students = await getAccessibleStudentsWithGrades(profile);
  const { student: selectedStudentId } = await searchParams;

  if (students.length === 0) {
    return (
      <>
        <PageHeader title="Kaynaklar" />
        <EmptyState title="Henüz bir öğrenciyle eşleştirilmedin" />
      </>
    );
  }

  const activeStudent = students.find((s) => s.id === selectedStudentId) ?? students[0];

  const [shelf, approved, pending] = await Promise.all([
    getStudentShelf(activeStudent.id),
    // Veliye yalnızca çocuğun sınıfına ait kitaplar; sınıf bilinmiyorsa hepsi.
    getApprovedBooks({ grade: activeStudent.grade_level }),
    getPendingBooks(), // RLS: veli yalnızca kendi eklediklerini görür
  ]);

  const shelfBookIds = new Set(shelf.map((b) => b.id));
  const library = approved.filter((b) => !shelfBookIds.has(b.id));
  const myPending = pending.filter((b) => b.created_by === profile.id);

  return (
    <>
      <PageHeader
        title="Kaynaklar"
        description={`Kütüphaneden ${activeStudent.full_name} için kitap seç; olmayan kitabı ekle, öğretmen onaylayınca kitaplığa atayabilirsin.`}
        action={<AddBookDialog role="parent" />}
      />

      {students.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {students.map((s) => {
            const active = s.id === activeStudent.id;
            return (
              <Link
                key={s.id}
                href={`/parent/resources?student=${s.id}`}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all active:scale-95",
                  active
                    ? "gradient-surface border-transparent text-white shadow-md shadow-primary/25"
                    : "border-input bg-background text-muted-foreground hover:bg-accent",
                )}
              >
                {s.full_name}
              </Link>
            );
          })}
        </div>
      )}

      {/* Çocuğun kitaplığı */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {activeStudent.full_name} — Kitaplığı ({shelf.length})
        </h2>
        {shelf.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Kitaplık henüz boş"
            description="Aşağıdaki kütüphaneden “Kitaplığa Ekle” diyerek başla. Eklediğin kitaplar öğrencinin ekranında görünür."
          />
        ) : (
          <div className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shelf.map((b) => (
              // min-w-0: grid hücresi içeriğin sıkışmayan genişliğine göre
              // büyümesin diye (bkz. BookFilters'taki aynı düzeltme notu).
              <div key={b.id} className="min-w-0">
                <BookCard
                  name={b.name}
                  subject={b.subject}
                  grade={b.grade_level}
                  difficulty={b.difficulty}
                  sectionCount={b.sections.length}
                  testCount={b.totalTests}
                  completedCount={b.completedCount}
                  footer={
                    <div className="flex items-center gap-1">
                      <RemoveFromShelfButton studentId={activeStudent.id} bookId={b.id} />
                      <Button asChild size="sm" variant="outline">
                        <Link
                          href={`/parent/resources/${b.id}?student=${activeStudent.id}`}
                        >
                          Aç
                        </Link>
                      </Button>
                    </div>
                  }
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Onay bekleyenler */}
      {myPending.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            <Clock3 className="h-4 w-4 text-warning" />
            Onay Bekleyen Kitapların ({myPending.length})
          </h2>
          <div className="stagger space-y-2">
            {myPending.map((b) => (
              <div
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warning/40 bg-warning/5 p-4"
              >
                <div className="min-w-0">
                  <p className="font-semibold leading-tight">{b.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {b.grade_level ? `${b.grade_level}. sınıf · ` : ""}
                    {b.subject ?? "Genel"} · {b.sections.length} bölüm · {b.totalTests}{" "}
                    test — öğretmen onayı bekliyor
                  </p>
                </div>
                <WithdrawPendingBookButton bookId={b.id} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Kütüphane */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          <Library className="h-4 w-4" />
          Kütüphane ({library.length})
        </h2>
        {library.length === 0 ? (
          <EmptyState
            icon={Library}
            title={
              approved.length > 0
                ? "Kütüphanedeki tüm kitaplar kitaplıkta"
                : "Kütüphane henüz boş"
            }
            description={
              approved.length > 0
                ? undefined
                : "“Kitap Ekle” ile ilk kitabı sen ekleyebilirsin; öğretmen onayladıktan sonra kitaplığa atarsın."
            }
          />
        ) : (
          <BookFilters
            showDifficulty
            books={library.map((b) => ({
              id: b.id,
              grade: b.grade_level,
              subject: b.subject,
              difficulty: b.difficulty,
              node: (
                <BookCard
                  name={b.name}
                  subject={b.subject}
                  grade={b.grade_level}
                  difficulty={b.difficulty}
                  sectionCount={b.sections.length}
                  testCount={b.totalTests}
                  footer={
                    <AddToShelfButton
                      studentId={activeStudent.id}
                      bookId={b.id}
                      studentName={activeStudent.full_name}
                    />
                  }
                />
              ),
            }))}
          />
        )}
      </section>
    </>
  );
}
