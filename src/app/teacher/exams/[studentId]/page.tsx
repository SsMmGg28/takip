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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{student.full_name} — Denemeler</h1>
        <CreateExamDialog studentId={studentId} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Deneme adı</TableHead>
            <TableHead>Tarih</TableHead>
            <TableHead className="text-right">İşlem</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {((exams as Exam[]) ?? []).map((exam) => (
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
          {!exams?.length && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                Henüz deneme eklenmedi.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
