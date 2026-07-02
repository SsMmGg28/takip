import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { CreateHomeworkDialog } from "@/components/teacher/create-homework-dialog";
import { HomeworkRowActions } from "@/components/teacher/homework-row-actions";
import { AttachmentDownloadLink } from "@/components/homework/attachment-download-link";
import { getApprovedBooks } from "@/lib/books";
import type { Homework, HomeworkTest, ResourceBook, ResourceBookSection } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  assigned: "Bekliyor",
  completed: "Tamamlandı",
  overdue: "Gecikti",
};

export default async function TeacherStudentHomeworkPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", studentId)
    .single();
  if (!student) notFound();

  const [{ data: homework }, books] = await Promise.all([
    supabase
      .from("homework")
      .select("*")
      .eq("student_id", studentId)
      .order("due_date", { ascending: true, nullsFirst: false }),
    getApprovedBooks(),
  ]);

  const homeworkIds = (homework ?? []).map((h) => h.id);
  const { data: tests } = homeworkIds.length
    ? await supabase
        .from("homework_tests")
        .select("*")
        .in("homework_id", homeworkIds)
    : { data: [] };

  const bookById = new Map((books ?? []).map((b) => [b.id, b as ResourceBook]));
  const sectionById = new Map<string, ResourceBookSection>();
  for (const b of books) for (const s of b.sections) sectionById.set(s.id, s);

  const testsByHomework = new Map<string, HomeworkTest[]>();
  for (const t of (tests as HomeworkTest[] | null) ?? []) {
    if (!testsByHomework.has(t.homework_id)) testsByHomework.set(t.homework_id, []);
    testsByHomework.get(t.homework_id)!.push(t);
  }

  return (
    <>
      <PageHeader
        title={`${student.full_name} — Ödevler`}
        action={<CreateHomeworkDialog studentId={studentId} books={books} />}
      />

      {!homework?.length ? (
        <EmptyState
          icon={ClipboardList}
          title="Henüz ödev yok"
          description="Yukarıdaki “Yeni Ödev Ekle” ile başla."
        />
      ) : (
        <div className="space-y-3">
          {((homework as Homework[]) ?? []).map((hw) => {
            const book = hw.book_id ? bookById.get(hw.book_id) : null;
            const hwTests = testsByHomework.get(hw.id) ?? [];
            return (
              <Card key={hw.id}>
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{hw.title}</p>
                        <Badge variant={hw.status === "completed" ? "default" : "outline"}>
                          {STATUS_LABEL[hw.status]}
                        </Badge>
                      </div>
                      {hw.due_date && (
                        <p className="text-xs text-muted-foreground">
                          Teslim: {new Date(hw.due_date).toLocaleDateString("tr-TR")}
                        </p>
                      )}
                      {book && (
                        <p className="text-xs text-muted-foreground">
                          📕 {book.name}
                          {book.subject ? ` — ${book.subject}` : ""}
                        </p>
                      )}
                    </div>
                    <HomeworkRowActions
                      id={hw.id}
                      studentId={studentId}
                      status={hw.status}
                    />
                  </div>

                  {hw.description && (
                    <p className="text-sm text-muted-foreground">{hw.description}</p>
                  )}

                  {hwTests.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {hwTests
                        .sort((a, b) => a.test_number - b.test_number)
                        .map((t) => {
                          const s = sectionById.get(t.section_id);
                          return (
                            <Badge key={t.id} variant="secondary">
                              {s ? `${s.name} · Test ${t.test_number}` : `Test ${t.test_number}`}
                            </Badge>
                          );
                        })}
                    </div>
                  )}

                  {hw.attachment_path && hw.attachment_name && (
                    <AttachmentDownloadLink
                      path={hw.attachment_path}
                      name={hw.attachment_name}
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Yeni kitap eklemek için{" "}
        <Link href="/teacher/resources" className="underline">
          Kaynaklar
        </Link>{" "}
        sayfasını kullan.
      </p>
    </>
  );
}
