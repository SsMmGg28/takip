import { requireRole } from "@/lib/auth";
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

export default async function StudentHomeworkPage() {
  const profile = await requireRole(["student"]);
  const supabase = await createClient();

  const { data: homework } = await supabase
    .from("homework")
    .select("*")
    .eq("student_id", profile.id)
    .order("due_date", { ascending: true, nullsFirst: false });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Ödevlerim</h1>
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
              <TableCell className="text-muted-foreground">{hw.description ?? "—"}</TableCell>
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
    </div>
  );
}
