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
import type { StudentResourceProgress } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  not_started: "Başlanmadı",
  in_progress: "Devam ediyor",
  completed: "Tamamlandı",
};

export default async function ParentResourcesPage() {
  const profile = await requireRole(["parent"]);
  const students = await getAccessibleStudents(profile);
  const supabase = await createClient();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold">Kaynaklar</h1>
      {students.length === 0 && (
        <p className="text-muted-foreground">Eşleştirilmiş öğrenci bulunamadı.</p>
      )}
      {await Promise.all(
        students.map(async (student) => {
          const { data: resources } = await supabase
            .from("student_resource_progress")
            .select("*")
            .eq("student_id", student.id)
            .order("subject");

          return (
            <section key={student.id} className="flex flex-col gap-2">
              <h2 className="font-medium text-muted-foreground">{student.full_name}</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ders</TableHead>
                    <TableHead>Kaynak</TableHead>
                    <TableHead>Not</TableHead>
                    <TableHead>Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {((resources as StudentResourceProgress[]) ?? []).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.subject}</TableCell>
                      <TableCell>{r.book_title}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.progress_note ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.status === "completed" ? "default" : "outline"}>
                          {STATUS_LABEL[r.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!resources?.length && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Henüz kaynak eklenmedi.
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
