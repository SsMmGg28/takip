"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createCalendarEvent,
  updateCalendarEvent,
} from "@/app/teacher/calendar/actions";
import type { CalendarEvent, Profile } from "@/lib/types";

/** ISO tarihini datetime-local inputunun beklediği yerel "YYYY-MM-DDTHH:MM" biçimine çevirir. */
function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Etkinlik oluşturma/düzenleme formu: `event` verilirse düzenleme modunda çalışır. */
function CalendarEventForm({
  students,
  event,
  onDone,
}: {
  students: Profile[];
  event?: CalendarEvent;
  onDone: () => void;
}) {
  const [type, setType] = useState(event?.type ?? "lesson");
  const [studentId, setStudentId] = useState(event?.student_id ?? "general");
  const [weekly, setWeekly] = useState(event?.recurrence === "weekly");

  return (
    <form
      action={async (formData) => {
        if (event) await updateCalendarEvent(formData);
        else await createCalendarEvent(formData);
        onDone();
      }}
      className="flex flex-col gap-4"
    >
      {event && <input type="hidden" name="id" value={event.id} />}
      <input type="hidden" name="type" value={type} />
      <input
        type="hidden"
        name="student_id"
        value={studentId === "general" ? "" : studentId}
      />
      <input type="hidden" name="recurrence" value={weekly ? "weekly" : ""} />

      <div className="flex flex-col gap-2">
        <Label>Tür</Label>
        <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lesson">Ders saati</SelectItem>
            <SelectItem value="reminder">Genel hatırlatma</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Öğrenci</Label>
        <Select value={studentId} onValueChange={setStudentId}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">Genel (herkese görünür)</SelectItem>
            {students.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Başlık</Label>
        <Input id="title" name="title" defaultValue={event?.title} required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="start_at">Tarih ve saat</Label>
        <Input
          id="start_at"
          name="start_at"
          type="datetime-local"
          defaultValue={event ? toLocalInputValue(event.start_at) : undefined}
          required
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={weekly} onCheckedChange={(v) => setWeekly(v === true)} />
        Her hafta tekrarla (aynı gün ve saat)
      </label>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Açıklama (opsiyonel)</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={event?.description ?? undefined}
        />
      </div>

      <Button type="submit">Kaydet</Button>
    </form>
  );
}

export function CreateCalendarEventDialog({ students }: { students: Profile[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Yeni Etkinlik Ekle</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Etkinlik Ekle</DialogTitle>
        </DialogHeader>
        <CalendarEventForm students={students} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

export function EditCalendarEventDialog({
  event,
  students,
}: {
  event: CalendarEvent;
  students: Profile[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Pencil className="h-3.5 w-3.5" />
          Düzenle
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Etkinliği Düzenle</DialogTitle>
        </DialogHeader>
        <CalendarEventForm
          students={students}
          event={event}
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
