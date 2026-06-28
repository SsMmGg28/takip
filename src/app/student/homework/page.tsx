import { ClipboardList } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getHomeworkForStudent } from "@/lib/homework-fetch";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { HomeworkCard } from "@/components/homework/homework-card";

export default async function StudentHomeworkPage() {
  const profile = await requireRole(["student"]);
  const { items, sectionById } = await getHomeworkForStudent(profile.id);

  return (
    <>
      <PageHeader
        title="Ödevlerim"
        description="Öğretmenin sana verdiği ödevler."
      />

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
            />
          ))}
        </div>
      )}
    </>
  );
}
