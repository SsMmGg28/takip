import { ClipboardList } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getAccessibleStudents } from "@/lib/students";
import { getHomeworkForStudent } from "@/lib/homework-fetch";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { HomeworkCard } from "@/components/homework/homework-card";

export const metadata = { title: "Ödevler" };

export default async function ParentHomeworkPage() {
  const profile = await requireRole(["parent"]);
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
      ...(await getHomeworkForStudent(student.id)),
    })),
  );

  return (
    <>
      <PageHeader title="Ödevler" description="Çocuğunun ödevlerinin tamamı." />

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
