"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
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
import type { StudyScheduleEntry } from "@/lib/types";

/**
 * Programa etkinlik ekleme diyaloğu. `entries` (görüntülenen haftanın mevcut
 * kayıtları) verilirse, seçilen gün/saat aralığı mevcut bir etkinlikle
 * çakışıyorsa engellemeyen bir uyarı gösterilir — öğretmen öğrencinin mevcut
 * programını görerek çakışmadan kaçınabilir.
 */
export function AddScheduleEntryDialog({
  studentId,
  redirectPath,
  weekStart,
  entries = [],
}: {
  studentId: string;
  redirectPath: string;
  weekStart: string;
  entries?: StudyScheduleEntry[];
}) {
  const [open, setOpen] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState("0");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const conflict =
    startTime && endTime
      ? entries.find(
          (e) =>
            e.day_of_week === Number(dayOfWeek) &&
            e.start_time.slice(0, 5) < endTime &&
            startTime < e.end_time.slice(0, 5),
        )
      : undefined;

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
            setStartTime("");
            setEndTime("");
          }}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="student_id" value={studentId} />
          <input type="hidden" name="redirect_path" value={redirectPath} />
          <input type="hidden" name="day_of_week" value={dayOfWeek} />
          <input type="hidden" name="week_start" value={weekStart} />

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
              <Input
                id="start_time"
                name="start_time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="end_time">Bitiş</Label>
              <Input
                id="end_time"
                name="end_time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          {conflict && (
            <p className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Bu saat aralığı mevcut bir etkinlikle çakışıyor:{" "}
              {conflict.start_time.slice(0, 5)}–{conflict.end_time.slice(0, 5)}{" "}
              {conflict.activity_label}. Yine de kaydedebilirsin.
            </p>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="activity_label">Ders/Konu</Label>
            <Input
              id="activity_label"
              name="activity_label"
              required
              placeholder="Örn: Matematik - Kesirler"
            />
          </div>

          <Button type="submit">Kaydet</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
