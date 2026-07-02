import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ExamDetail } from "@/components/exams/exam-detail";
import { getExamDetails } from "@/lib/exams";

export default async function StudentExamDetailPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const profile = await requireRole(["student"]);
  const { examId } = await params;

  const details = await getExamDetails(examId);
  if (!details || details.exam.student_id !== profile.id) notFound();

  return (
    <>
      <PageHeader
        title={details.exam.exam_name}
        description="Deneme detayı — ders sonuçları ve kazanım dökümü"
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href="/student/exams">
              <ArrowLeft className="h-4 w-4" />
              Geri
            </Link>
          </Button>
        }
      />
      <ExamDetail exam={details.exam} kazanimResults={details.kazanimResults} />
    </>
  );
}
