import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { HomeworkCard } from "@/components/homework/homework-card";
import { CreateHomeworkDialog } from "@/components/teacher/create-homework-dialog";
import { CheckHomeworkDialog } from "@/components/teacher/check-homework-dialog";
import { EditHomeworkDialog } from "@/components/teacher/edit-homework-dialog";
import {
  DeleteHomeworkButton,
  ReassignMissingButton,
} from "@/components/teacher/homework-row-actions";
import { getApprovedBooks } from "@/lib/books";
import { getAccessibleStudentsWithGrades } from "@/lib/students";
import { getHomeworkForStudent } from "@/lib/homework-fetch";

export default async function TeacherStudentHomeworkPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const profile = await requireRole(["teacher"]);
  const { studentId } = await params;
  const supabase = await createClient();

  // Dört bağımsız sorgu tek dalgada; öğrenci listesi sınıf bilgisiyle tek
  // sorguda gelir.
  const [{ data: student }, allStudents, books, { items, sectionById }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", studentId).single(),
    getAccessibleStudentsWithGrades(profile),
    getApprovedBooks(),
    getHomeworkForStudent(studentId),
  ]);
  if (!student) notFound();

  // Toplu gönderim boyutları (düzenlemede "grubun tamamına uygula" seçeneği için)
  const groupIds = Array.from(
    new Set(items.map((it) => it.homework.assignment_group_id)),
  );
  const { data: groupRows } = groupIds.length
    ? await supabase
        .from("homework")
        .select("assignment_group_id")
        .in("assignment_group_id", groupIds)
    : { data: [] };
  const groupSize = new Map<string, number>();
  for (const r of groupRows ?? []) {
    groupSize.set(
      r.assignment_group_id,
      (groupSize.get(r.assignment_group_id) ?? 0) + 1,
    );
  }

  const studentOptions = allStudents.map((s) => ({
    id: s.id,
    fullName: s.full_name,
    grade: s.grade_level,
  }));
  const bookOptions = books.map((b) => ({
    id: b.id,
    name: b.name,
    subject: b.subject,
    grade: b.grade_level,
    sections: b.sections.map((s) => ({
      id: s.id,
      name: s.name,
      testCount: s.test_count,
    })),
  }));
  const bookOptionById = new Map(bookOptions.map((b) => [b.id, b]));

  return (
    <>
      <PageHeader
        title={`${student.full_name} — Ödevler`}
        description="Kontrol ettikçe yapılan testler kitap ilerlemesine işlenir; eksiklerde veliye bildirim gider."
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/teacher/homework"
              className="text-sm text-muted-foreground hover:underline"
            >
              ← Ödev Merkezi
            </Link>
            <CreateHomeworkDialog
              students={studentOptions}
              books={bookOptions}
              defaultStudentIds={[studentId]}
              triggerLabel="Ödev Gönder"
            />
          </div>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Henüz ödev yok"
          description="“Ödev Gönder” ile bu öğrenciye (veya toplu olarak birden fazla öğrenciye) ödev gönder."
        />
      ) : (
        <div className="stagger space-y-3">
          {items.map((it) => {
            const hw = it.homework;
            const checkTests = it.tests.map((t) => ({
              sectionId: t.section_id,
              sectionName: sectionById.get(t.section_id)?.name ?? "Bölüm",
              testNumber: t.test_number,
              completed: t.completed,
              studentMarked: t.student_marked,
            }));
            const missingCount = it.tests.filter((t) => !t.completed).length;
            const showReassign =
              hw.status === "incomplete" && it.tests.length > 0 && missingCount > 0;

            return (
              <HomeworkCard
                key={hw.id}
                homework={hw}
                book={it.book}
                tests={it.tests}
                sectionById={sectionById}
                actions={
                  <div className="flex flex-wrap justify-end gap-2">
                    <CheckHomeworkDialog
                      homeworkId={hw.id}
                      homeworkTitle={hw.title}
                      studentName={student.full_name}
                      tests={checkTests}
                      checkedBefore={Boolean(hw.checked_at)}
                      studentSaysDone={Boolean(hw.student_marked_done_at)}
                      initialFeedback={hw.feedback}
                    />
                    <EditHomeworkDialog
                      homeworkId={hw.id}
                      initialTitle={hw.title}
                      initialDescription={hw.description}
                      initialDueDate={hw.due_date}
                      book={hw.book_id ? bookOptionById.get(hw.book_id) ?? null : null}
                      initialTests={it.tests.map(
                        (t) => `${t.section_id}:${t.test_number}`,
                      )}
                      groupSize={groupSize.get(hw.assignment_group_id) ?? 1}
                    />
                    {showReassign && (
                      <ReassignMissingButton
                        homeworkId={hw.id}
                        missingCount={missingCount}
                      />
                    )}
                    <DeleteHomeworkButton homeworkId={hw.id} />
                  </div>
                }
              />
            );
          })}
        </div>
      )}
    </>
  );
}
