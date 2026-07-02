import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ExamDetail } from "@/components/exams/exam-detail";
import {
  DeleteExamButton,
  EditRequestStatusBadge,
  RequestEditButton,
} from "@/components/exams/exam-actions";
import { getExamDetails, getEditRequestsForStudent } from "@/lib/exams";

export default async function ParentExamDetailPage({
  params,
}: {
  params: Promise<{ studentId: string; examId: string }>;
}) {
  const profile = await requireRole(["parent"]);
  const { studentId, examId } = await params;

  const details = await getExamDetails(examId);
  if (!details || details.exam.student_id !== studentId) notFound();

  const requests = await getEditRequestsForStudent(studentId);
  const myActive = requests.find(
    (r) =>
      r.exam_id === examId &&
      r.requested_by === profile.id &&
      (r.status === "pending" || r.status === "approved"),
  );
  const canMutate = myActive?.status === "approved";

  return (
    <>
      <PageHeader
        title={details.exam.exam_name}
        description="Deneme detayı — ders sonuçları ve kazanım dökümü"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/parent/exams/${studentId}`}>
                <ArrowLeft className="h-4 w-4" />
                Geri
              </Link>
            </Button>
            {myActive && <EditRequestStatusBadge status={myActive.status} />}
            {canMutate && (
              <>
                <Button size="sm" asChild>
                  <Link href={`/parent/exams/${studentId}/${examId}/edit`}>
                    <Pencil className="h-4 w-4" />
                    Düzenle
                  </Link>
                </Button>
                <DeleteExamButton examId={examId} />
              </>
            )}
            {!myActive && <RequestEditButton examId={examId} />}
          </div>
        }
      />
      <ExamDetail exam={details.exam} kazanimResults={details.kazanimResults} />
    </>
  );
}
