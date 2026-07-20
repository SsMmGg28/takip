import { Suspense } from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getHomeworkForStudent } from "@/lib/homework-fetch";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { HomeworkCard } from "@/components/homework/homework-card";
import { StudentMarkPanel } from "@/components/homework/student-mark-panel";
import { CardListSkeleton } from "@/components/skeletons";
import type { HomeworkCursorContext } from "@/lib/homework-fetch";

export const metadata = { title: "Ödevler" };

export default async function StudentHomeworkPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; cursor?: string }>;
}) {
  const profile = await requireRole(["student"]);
  const params = await searchParams;
  const view = params.view === "archive" ? "archive" : "active";
  const result = getHomeworkForStudent(profile.id, {
    view,
    cursor: params.cursor,
  });

  return (
    <>
      <PageHeader
        title="Ödevlerim"
        description="Öğretmenin sana verdiği ödevler. Yaptığın testleri işaretle; öğretmen kontrolüyle kesinleşir."
      />

      <nav
        className="grid grid-cols-2 gap-2 rounded-2xl bg-muted/50 p-1"
        aria-label="Ödev görünümü"
      >
        <Link
          href="/student/homework"
          aria-current={view === "active" ? "page" : undefined}
          className={`flex min-h-11 items-center justify-center rounded-xl px-3 text-sm font-medium ${
            view === "active"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          Aktif ödevler
        </Link>
        <Link
          href="/student/homework?view=archive"
          aria-current={view === "archive" ? "page" : undefined}
          className={`flex min-h-11 items-center justify-center rounded-xl px-3 text-sm font-medium ${
            view === "archive"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          Tamamlananlar
        </Link>
      </nav>

      <Suspense fallback={<CardListSkeleton count={3} />}>
        <HomeworkResults result={result} view={view} />
      </Suspense>
    </>
  );
}

async function HomeworkResults({
  result,
  view,
}: {
  result: Promise<HomeworkCursorContext>;
  view: "active" | "archive";
}) {
  const { items, sectionById, nextCursor } = await result;
  return items.length === 0 ? (
    <EmptyState
      icon={ClipboardList}
      title={view === "archive" ? "Tamamlanan ödev yok" : "Aktif ödev yok"}
    />
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
      {nextCursor && (
        <Link
          href={`/student/homework?view=${view}&cursor=${encodeURIComponent(nextCursor)}`}
          className="flex min-h-11 items-center justify-center rounded-xl border bg-card px-4 text-sm font-medium hover:bg-accent"
        >
          Daha eski ödevleri göster
        </Link>
      )}
    </div>
  );
}
