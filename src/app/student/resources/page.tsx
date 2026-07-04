import { BookOpen } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { BookCard } from "@/components/resources/book-card";
import { getStudentShelf } from "@/lib/books";

export default async function StudentResourcesPage() {
  const profile = await requireRole(["student"]);
  const shelf = await getStudentShelf(profile.id);

  return (
    <>
      <PageHeader
        title="Kitaplığım"
        description="Velinin senin için seçtiği kaynak kitaplar. Bir kitabı aç, çözdüğün testleri işaretle."
      />

      {shelf.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Kitaplığın henüz boş"
          description="Velin kütüphaneden kitap eklediğinde burada görünecek."
        />
      ) : (
        <div className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shelf.map((b) => (
            <BookCard
              key={b.id}
              href={`/student/resources/${b.id}`}
              name={b.name}
              subject={b.subject}
              sectionCount={b.sections.length}
              testCount={b.totalTests}
              completedCount={b.completedCount}
            />
          ))}
        </div>
      )}
    </>
  );
}
