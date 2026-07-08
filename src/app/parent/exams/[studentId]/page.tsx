import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ExamAnalysisSection } from "@/components/exams/exam-analysis-section";
import { ExamList } from "@/components/exams/exam-list";
import { getExamOverview } from "@/lib/exam-analysis";
import { getEditRequestsForStudent } from "@/lib/exams";
import { getStudentExamInfo } from "@/lib/students";
import { examsEnabledForGrade } from "@/lib/kazanim";

export default async function ParentStudentExamsPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  await requireRole(["parent"]);
  const { studentId } = await params;
  const supabase = await createClient();

  // RLS: veli yalnızca kendi çocuğunun profilini görebilir.
  const { data: student } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", studentId)
    .single();
  if (!student) notFound();

  const { grade, targetScore } = await getStudentExamInfo(studentId);
  if (!examsEnabledForGrade(grade)) notFound();

  const [overview, editRequests] = await Promise.all([
    getExamOverview(studentId),
    getEditRequestsForStudent(studentId),
  ]);

  return (
    <>
      <PageHeader
        title={student.full_name}
        description={`${grade}. sınıf — deneme analizi ve geçmiş denemeler`}
        action={
          <Button asChild>
            <Link href={`/parent/exams/${studentId}/new`}>
              <Plus className="h-4 w-4" />
              Yeni Deneme Ekle
            </Link>
          </Button>
        }
      />

      <ExamAnalysisSection
        overview={overview}
        studentId={studentId}
        targetScore={targetScore}
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Geçmiş Denemeler</h2>
        <p className="text-sm text-muted-foreground">
          Girilmiş bir denemede değişiklik veya silme için öğretmene düzenleme
          talebi gönderebilirsin; onaylandığında düzenleme açılır.
        </p>
        <ExamList
          exams={overview.exams}
          detailHrefPrefix={`/parent/exams/${studentId}`}
          role="parent"
          editRequests={editRequests}
        />
      </section>
    </>
  );
}
