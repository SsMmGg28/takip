"use client";

import { useState } from "react";
import { CalendarDays, Repeat, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteCalendarEvent } from "@/app/teacher/calendar/actions";
import { EditCalendarEventDialog } from "@/components/teacher/create-calendar-event-dialog";
import type { CalendarEvent, Profile } from "@/lib/types";

/** Öğretmenin oluşturduğu etkinlikleri düzenleyip silebildiği liste. */
export function EventManageList({
  events,
  students,
}: {
  events: CalendarEvent[];
  students: Profile[];
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const studentNameById = new Map(students.map((s) => [s.id, s.full_name]));

  if (events.length === 0) return null;

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const fd = new FormData();
      fd.set("id", id);
      await deleteCalendarEvent(fd);
      toast.success("Etkinlik silindi.");
    } catch {
      toast.error("Etkinlik silinemedi.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="gradient-surface flex h-8 w-8 items-center justify-center rounded-lg text-white">
            <CalendarDays className="h-4 w-4" />
          </span>
          Etkinlikleri Yönet
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2">
          {events.map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{e.title}</p>
                  <Badge variant="outline" className="text-[10px]">
                    {e.type === "lesson" ? "Ders" : "Hatırlatma"}
                  </Badge>
                  {e.recurrence === "weekly" && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-primary">
                      <Repeat className="h-3 w-3" />
                      Her hafta
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(e.start_at).toLocaleString("tr-TR", {
                    day: "2-digit",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {e.student_id
                    ? ` · ${studentNameById.get(e.student_id) ?? "?"}`
                    : " · Genel"}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <EditCalendarEventDialog event={e} students={students} />
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={deletingId === e.id}
                  onClick={() => handleDelete(e.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Sil
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
