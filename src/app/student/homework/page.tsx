import { ClipboardList } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getHomeworkForStudent } from "@/lib/homework-fetch";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { HomeworkCard } from "@/components/homework/homework-card";
import { StudentMarkPanel } from "@/components/homework/student-mark-panel";

export const metadata = { title: "Ödevler" };

export default async function StudentHomeworkPage() {
  const profile = await requireRole(["student"]);
  const { items, sectionById } = await getHomeworkForStudent(profile.id);

  return (
    <>
      <PageHeader
        title="Ödevlerim"
        description="Öğretmenin sana verdiği ödevler. Yaptığın testleri işaretle; öğretmen kontrolüyle kesinleşir."
      />

      {items.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Henüz ödev yok" />
      ) : (
        <div className="space-y-3">
          {items.map((it) => {
            const checked = Boolean(it.homework.checked_at);
            return (
              <HomeworkCard
                key={it.homework.id}
                homework={it.homework}
                book={it.book}
                tests={it.tests}
                sectionById={sectionById}
                href={it.book ? `/student/resources/${it.book.id}` : undefined}
                testsSlot={
                  checked ? undefined : (
                    <StudentMarkPanel
                      homeworkId={it.homework.id}
                      markedDone={Boolean(it.homework.student_marked_done_at)}
                      tests={it.tests.map((t) => {
                        const s = sectionById.get(t.section_id);
                        return {
                          sectionId: t.section_id,
                          testNumber: t.test_number,
                          label: s
                            ? `${s.name} · Test ${t.test_number}`
                            : `Test ${t.test_number}`,
                          marked: t.student_marked,
                        };
                      })}
                    />
                  )
                }
              />
            );
          })}
        </div>
      )}
    </>
  );
}
