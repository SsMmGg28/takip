"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { createCalendarEvent } from "@/app/teacher/calendar/actions";
import type { Profile } from "@/lib/types";

export function CreateCalendarEventDialog({ students }: { students: Profile[] }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("lesson");
  const [studentId, setStudentId] = useState("general");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Yeni Etkinlik Ekle</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Etkinlik Ekle</DialogTitle>
        </DialogHeader>
        <form
          action={async (formData) => {
            await createCalendarEvent(formData);
            setOpen(false);
          }}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="student_id" value={studentId === "general" ? "" : studentId} />

          <div className="flex flex-col gap-2">
            <Label>Tür</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lesson">Özel ders saati</SelectItem>
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
            <Input id="title" name="title" required />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="start_at">Tarih ve saat</Label>
            <Input id="start_at" name="start_at" type="datetime-local" required />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Açıklama (opsiyonel)</Label>
            <Textarea id="description" name="description" />
          </div>

          <Button type="submit">Kaydet</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
