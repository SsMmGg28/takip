import Link from "next/link";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { CreateHomeworkDialog } from "@/components/teacher/create-homework-dialog";
import {
  HomeworkCenter,
  type CenterGroup,
} from "@/components/teacher/homework-center";
import { getApprovedBooks } from "@/lib/books";
import { getAssignmentGroups } from "@/lib/homework-fetch";
import type { Profile } from "@/lib/types";

export default async function TeacherHomeworkPage() {
  await requireRole(["teacher"]);
  const supabase = await createClient();

  const [{ data: students }, books, groups] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "student").order("full_name"),
    getApprovedBooks(),
    getAssignmentGroups(),
  ]);

  const studentList = (students as Profile[] | null) ?? [];
  const studentOptions = studentList.map((s) => ({ id: s.id, fullName: s.full_name }));
  const bookOptions = books.map((b) => ({
    id: b.id,
    name: b.name,
    subject: b.subject,
    sections: b.sections.map((s) => ({
      id: s.id,
      name: s.name,
      testCount: s.test_count,
    })),
  }));
  const bookOptionById = new Map(bookOptions.map((b) => [b.id, b]));

  // Client bileşenine düz veri: Map yerine bölüm adları test satırlarına işlenir.
  const centerGroups: CenterGroup[] = groups.map((g) => {
    const firstEntry = g.entries[0];
    return {
      groupId: g.groupId,
      title: g.title,
      description: g.description,
      dueDate: g.dueDate,
      createdAt: g.createdAt,
      attachmentName: g.attachmentName,
      bookName: g.book?.name ?? null,
      book: g.book ? (bookOptionById.get(g.book.id) ?? null) : null,
      initialTests: (firstEntry?.tests ?? []).map(
        (t) => `${t.section_id}:${t.test_number}`,
      ),
      entries: g.entries.map(({ homework, student, tests }) => ({
        homeworkId: homework.id,
        studentId: homework.student_id,
        studentName: student?.full_name ?? "?",
        status: homework.status,
        dueDate: homework.due_date,
        checked: Boolean(homework.checked_at),
        feedback: homework.feedback,
        studentSaysDone: Boolean(homework.student_marked_done_at),
        tests: tests.map((t) => ({
          sectionId: t.section_id,
          sectionName: g.sectionById.get(t.section_id)?.name ?? "Bölüm",
          testNumber: t.test_number,
          completed: t.completed,
          studentMarked: t.student_marked,
        })),
      })),
    };
  });

  return (
    <>
      <PageHeader
        title="Ödev Merkezi"
        description="Durum sekmeleriyle süz, öğrenciye göre filtrele; kontrolü buradan sayfa değiştirmeden yap."
        action={<CreateHomeworkDialog students={studentOptions} books={bookOptions} />}
      />

      {studentList.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Henüz öğrenci yok"
          description={
            <>
              Önce{" "}
              <Link href="/teacher/students" className="underline">
                Öğrenciler
              </Link>{" "}
              sayfasından öğrenci ekle.
            </>
          }
        />
      ) : (
        <HomeworkCenter groups={centerGroups} students={studentOptions} />
      )}
    </>
  );
}
