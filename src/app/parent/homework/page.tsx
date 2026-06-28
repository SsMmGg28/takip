import { requireRole } from "@/lib/auth";
import { getAccessibleStudents } from "@/lib/students";
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
import type { Homework } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  assigned: "Bekliyor",
  completed: "Tamamlandı",
  overdue: "Gecikti",
};

export default async function ParentHomeworkPage() {
  const profile = await requireRole(["parent"]);
  const students = await getAccessibleStudents(profile);
  const supabase = await createClient();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold">Ödevler</h1>
      {students.length === 0 && (
        <p className="text-muted-foreground">Eşleştirilmiş öğrenci bulunamadı.</p>
      )}
      {await Promise.all(
        students.map(async (student) => {
          const { data: homework } = await supabase
            .from("homework")
            .select("*")
            .eq("student_id", student.id)
            .order("due_date", { ascending: true, nullsFirst: false });

          return (
            <section key={student.id} className="flex flex-col gap-2">
              <h2 className="font-medium text-muted-foreground">{student.full_name}</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Başlık</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead>Teslim tarihi</TableHead>
                    <TableHead>Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {((homework as Homework[]) ?? []).map((hw) => (
                    <TableRow key={hw.id}>
                      <TableCell className="font-medium">{hw.title}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {hw.description ?? "—"}
                      </TableCell>
                      <TableCell>{hw.due_date ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={hw.status === "completed" ? "default" : "outline"}>
                          {STATUS_LABEL[hw.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!homework?.length && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Henüz ödev eklenmedi.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </section>
          );
        }),
      )}
    </div>
  );
}
