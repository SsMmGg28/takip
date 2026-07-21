import { ClipboardList } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getAccessibleStudents } from "@/lib/students";
import { getHomeworkForStudent } from "@/lib/homework-fetch";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { HomeworkCard } from "@/components/homework/homework-card";
import Link from "next/link";

export const metadata = { title: "Ödevler" };

export default async function ParentHomeworkPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const profile = await requireRole(["parent"]);
  const view = (await searchParams).view === "archive" ? "archive" : "active";
  const students = await getAccessibleStudents(profile);

  if (students.length === 0) {
    return (
      <>
        <PageHeader title="Ödevler" />
        <EmptyState title="Henüz bir öğrenciyle eşleştirilmedin" />
      </>
    );
  }

  const results = await Promise.all(
    students.map(async (student) => ({
      student,
      ...(await getHomeworkForStudent(student.id, { view, limit: 25 })),
    })),
  );

  return (
    <>
      <PageHeader title="Ödevler" description="Çocuğunun ödevlerinin tamamı." />

      <nav
        className="grid grid-cols-2 gap-2 rounded-2xl bg-muted/50 p-1"
        aria-label="Ödev görünümü"
      >
        <Link
          href="/parent/homework"
          aria-current={view === "active" ? "page" : undefined}
          className={`flex min-h-11 items-center justify-center rounded-xl px-3 text-sm font-medium ${view === "active" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
        >
          Aktif ödevler
        </Link>
        <Link
          href="/parent/homework?view=archive"
          aria-current={view === "archive" ? "page" : undefined}
          className={`flex min-h-11 items-center justify-center rounded-xl px-3 text-sm font-medium ${view === "archive" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
        >
          Tamamlananlar
        </Link>
      </nav>

      <div className="space-y-8">
        {results.map(({ student, items, sectionById }) => (
          <section key={student.id} className="space-y-3">
            {students.length > 1 && (
              <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                {student.full_name}
              </h2>
            )}
            {items.length === 0 ? (
              <EmptyState icon={ClipboardList} title="Henüz ödev yok" />
            ) : (
              <div className="space-y-3">
                {items.map((it) => (
                  <HomeworkCard
                    key={it.homework.id}
                    homework={it.homework}
                    book={it.book}
                    tests={it.tests}
                    sectionById={sectionById}
                    href={
                      it.book
                        ? `/parent/resources/${it.book.id}?student=${student.id}`
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
