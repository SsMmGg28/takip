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
import { Button } from "@/components/ui/button";
import { CreateCalendarEventDialog } from "@/components/teacher/create-calendar-event-dialog";
import { deleteCalendarEvent } from "@/app/teacher/calendar/actions";
import type { CalendarEvent, Profile } from "@/lib/types";

const TYPE_LABEL: Record<string, string> = {
  lesson: "Özel ders",
  reminder: "Hatırlatma",
  homework_deadline: "Ödev teslim",
};

export default async function TeacherCalendarPage() {
  const supabase = await createClient();

  const { data: students } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .order("full_name");

  const { data: events } = await supabase
    .from("calendar_events")
    .select("*")
    .order("start_at", { ascending: true });

  const studentNameById = new Map(
    ((students as Profile[]) ?? []).map((s) => [s.id, s.full_name]),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Takvim</h1>
        <CreateCalendarEventDialog students={(students as Profile[]) ?? []} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Başlık</TableHead>
            <TableHead>Tür</TableHead>
            <TableHead>Öğrenci</TableHead>
            <TableHead>Tarih</TableHead>
            <TableHead className="text-right">İşlem</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {((events as CalendarEvent[]) ?? []).map((e) => (
            <TableRow key={e.id}>
              <TableCell className="font-medium">{e.title}</TableCell>
              <TableCell>
                <Badge variant="outline">{TYPE_LABEL[e.type]}</Badge>
              </TableCell>
              <TableCell>
                {e.student_id ? studentNameById.get(e.student_id) ?? "—" : "Genel"}
              </TableCell>
              <TableCell>
                {new Date(e.start_at).toLocaleString("tr-TR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </TableCell>
              <TableCell className="text-right">
                <form action={deleteCalendarEvent}>
                  <input type="hidden" name="id" value={e.id} />
                  <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                    Sil
                  </Button>
                </form>
              </TableCell>
            </TableRow>
          ))}
          {!events?.length && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Henüz etkinlik eklenmedi.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
