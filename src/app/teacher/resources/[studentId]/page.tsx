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
import { CreateResourceDialog } from "@/components/teacher/create-resource-dialog";
import { ResourceRowActions } from "@/components/teacher/resource-row-actions";
import type { StudentResourceProgress } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  not_started: "Başlanmadı",
  in_progress: "Devam ediyor",
  completed: "Tamamlandı",
};

export default async function TeacherStudentResourcesPage({
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

  const { data: resources } = await supabase
    .from("student_resource_progress")
    .select("*")
    .eq("student_id", studentId)
    .order("subject");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{student.full_name} — Kaynaklar</h1>
        <CreateResourceDialog studentId={studentId} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ders</TableHead>
            <TableHead>Kaynak</TableHead>
            <TableHead>Not</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead className="text-right">İşlem</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {((resources as StudentResourceProgress[]) ?? []).map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.subject}</TableCell>
              <TableCell>{r.book_title}</TableCell>
              <TableCell className="text-muted-foreground">{r.progress_note ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={r.status === "completed" ? "default" : "outline"}>
                  {STATUS_LABEL[r.status]}
                </Badge>
              </TableCell>
              <TableCell>
                <ResourceRowActions id={r.id} studentId={studentId} status={r.status} />
              </TableCell>
            </TableRow>
          ))}
          {!resources?.length && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Henüz kaynak eklenmedi.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
