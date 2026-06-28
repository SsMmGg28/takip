"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { createScheduleEntry } from "@/lib/actions/schedule";
import { DAY_LABELS } from "@/lib/schedule";

export function AddScheduleEntryDialog({
  studentId,
  redirectPath,
}: {
  studentId: string;
  redirectPath: string;
}) {
  const [open, setOpen] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState("0");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Programa Ekle</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Çalışma Programına Ekle</DialogTitle>
        </DialogHeader>
        <form
          action={async (formData) => {
            await createScheduleEntry(formData);
            setOpen(false);
          }}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="student_id" value={studentId} />
          <input type="hidden" name="redirect_path" value={redirectPath} />
          <input type="hidden" name="day_of_week" value={dayOfWeek} />

          <div className="flex flex-col gap-2">
            <Label>Gün</Label>
            <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAY_LABELS.map((label, idx) => (
                  <SelectItem key={label} value={String(idx)}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="start_time">Başlangıç</Label>
              <Input id="start_time" name="start_time" type="time" required />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="end_time">Bitiş</Label>
              <Input id="end_time" name="end_time" type="time" required />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="activity_label">Ders/Konu</Label>
            <Input id="activity_label" name="activity_label" required placeholder="Örn: Matematik - Kesirler" />
          </div>

          <Button type="submit">Kaydet</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
