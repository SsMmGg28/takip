import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ExamDetail } from "@/components/exams/exam-detail";
import { DeleteExamButton } from "@/components/exams/exam-actions";
import { getExamDetails } from "@/lib/exams";

export default async function TeacherExamDetailPage({
  params,
}: {
  params: Promise<{ studentId: string; examId: string }>;
}) {
  const { studentId, examId } = await params;
  const details = await getExamDetails(examId);
  if (!details || details.exam.student_id !== studentId) notFound();

  return (
    <>
      <PageHeader
        title={details.exam.exam_name}
        description="Deneme detayı — ders sonuçları ve kazanım dökümü"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/teacher/exams/${studentId}`}>
                <ArrowLeft className="h-4 w-4" />
                Geri
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={`/teacher/exams/${studentId}/${examId}/edit`}>
                <Pencil className="h-4 w-4" />
                Düzenle
              </Link>
            </Button>
            <DeleteExamButton examId={examId} />
          </div>
        }
      />
      <ExamDetail exam={details.exam} kazanimResults={details.kazanimResults} />
    </>
  );
}
