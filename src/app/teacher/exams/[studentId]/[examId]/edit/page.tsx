import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ExamEntryForm } from "@/components/exams/exam-entry-form";
import { getExamDetails, toFormInitial } from "@/lib/exams";
import { getStudentGrade } from "@/lib/students";
import { examsEnabledForGrade } from "@/lib/kazanim";
import { requireRole } from "@/lib/auth";

export const metadata = { title: "Deneme Düzenle" };

export default async function TeacherExamEditPage({
  params,
}: {
  params: Promise<{ studentId: string; examId: string }>;
}) {
  const { studentId, examId } = await params;
  // Sayfa düzeyi rol koruması (savunma derinliği); header adasıyla tekilleşir.
  await requireRole(["teacher"]);
  const details = await getExamDetails(examId);
  if (!details || details.exam.student_id !== studentId) notFound();

  const grade = await getStudentGrade(studentId);
  if (!examsEnabledForGrade(grade)) notFound();

  return (
    <>
      <PageHeader
        title={`${details.exam.exam_name} — Düzenle`}
        description="Ders sonuçlarını ve kazanım işaretlerini güncelle."
      />
      <ExamEntryForm
        studentId={studentId}
        grade={grade}
        backHref={`/teacher/exams/${studentId}/${examId}`}
        examId={examId}
        initial={toFormInitial(details)}
      />
    </>
  );
}
