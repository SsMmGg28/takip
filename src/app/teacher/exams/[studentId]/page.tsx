import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreateExamDialog } from "@/components/teacher/create-exam-dialog";
import { deleteExam } from "@/app/teacher/exams/actions";
import type { Exam } from "@/lib/types";

export default async function TeacherStudentExamsPage({
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

  const { data: exams } = await supabase
    .from("exams")
    .select("*")
    .eq("student_id", studentId)
    .order("exam_date", { ascending: false });

  const examList = (exams as Exam[]) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold sm:text-xl">
          {student.full_name} — Denemeler
        </h1>
        <CreateExamDialog studentId={studentId} />
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Deneme adı</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead className="text-right">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {examList.map((exam) => (
              <TableRow key={exam.id}>
                <TableCell>
                  <Link
                    href={`/teacher/exams/${studentId}/${exam.id}`}
                    className="font-medium underline"
                  >
                    {exam.exam_name}
                  </Link>
                </TableCell>
                <TableCell>{exam.exam_date}</TableCell>
                <TableCell className="text-right">
                  <form action={deleteExam}>
                    <input type="hidden" name="id" value={exam.id} />
                    <input type="hidden" name="student_id" value={studentId} />
                    <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                      Sil
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
            {examList.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Henüz deneme eklenmedi.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-2 sm:hidden">
        {examList.length === 0 ? (
          <p className="rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">
            Henüz deneme eklenmedi.
          </p>
        ) : (
          examList.map((exam) => (
            <Card key={exam.id} className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={`/teacher/exams/${studentId}/${exam.id}`}
                    className="font-medium underline"
                  >
                    {exam.exam_name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{exam.exam_date}</p>
                </div>
                <form action={deleteExam} className="shrink-0">
                  <input type="hidden" name="id" value={exam.id} />
                  <input type="hidden" name="student_id" value={studentId} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                  >
                    Sil
                  </Button>
                </form>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
