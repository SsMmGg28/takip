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
import { Badge } from "@/components/ui/badge";
import { CreateHomeworkDialog } from "@/components/teacher/create-homework-dialog";
import { HomeworkRowActions } from "@/components/teacher/homework-row-actions";
import type { Homework } from "@/lib/types";

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

  const { data: homework } = await supabase
    .from("homework")
    .select("*")
    .eq("student_id", studentId)
    .order("due_date", { ascending: true, nullsFirst: false });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{student.full_name} — Ödevler</h1>
        <CreateHomeworkDialog studentId={studentId} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Başlık</TableHead>
            <TableHead>Açıklama</TableHead>
            <TableHead>Teslim tarihi</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead className="text-right">İşlem</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {((homework as Homework[]) ?? []).map((hw) => (
            <TableRow key={hw.id}>
              <TableCell className="font-medium">{hw.title}</TableCell>
              <TableCell className="text-muted-foreground">{hw.description ?? "—"}</TableCell>
              <TableCell>{hw.due_date ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={hw.status === "completed" ? "default" : "outline"}>
                  {STATUS_LABEL[hw.status]}
                </Badge>
              </TableCell>
              <TableCell>
                <HomeworkRowActions id={hw.id} studentId={studentId} status={hw.status} />
              </TableCell>
            </TableRow>
          ))}
          {!homework?.length && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Henüz ödev eklenmedi.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
