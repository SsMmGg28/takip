"use client";

import { useState } from "react";
import { AlertTriangle, Pencil } from "lucide-react";
import { toast } from "sonner";
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
import {
  createOwnScheduleEntry,
  createScheduleEntry,
  updateScheduleEntry,
  updateOwnScheduleEntry,
} from "@/lib/actions/schedule";
import { DAY_LABELS } from "@/lib/schedule";
import type { Kazanim } from "@/lib/kazanim";
import type { StudyScheduleEntry } from "@/lib/types";

/**
 * Programa etkinlik ekleme diyaloğu. `entries` (görüntülenen haftanın mevcut
 * kayıtları) verilirse, seçilen gün/saat aralığı mevcut bir etkinlikle
 * çakışıyorsa engellemeyen bir uyarı gösterilir. `forCurrentStudent` ile öğrenci
 * kendi programına ders/kazanım seçerek kayıt ekler veya kendi kaydını düzenler.
 */
export function AddScheduleEntryDialog({
  studentId,
  redirectPath,
  weekStart,
  entries = [],
  forCurrentStudent = false,
  subjects = [],
  kazanimlarBySubject = {},
  entry,
}: {
  studentId?: string;
  redirectPath: string;
  weekStart: string;
  entries?: StudyScheduleEntry[];
  forCurrentStudent?: boolean;
  subjects?: string[];
  kazanimlarBySubject?: Record<string, Kazanim[]>;
  entry?: StudyScheduleEntry;
}) {
  const [open, setOpen] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState(String(entry?.day_of_week ?? 0));
  const [startTime, setStartTime] = useState(entry?.start_time.slice(0, 5) ?? "");
  const [endTime, setEndTime] = useState(entry?.end_time.slice(0, 5) ?? "");
  const [subject, setSubject] = useState(entry?.subject ?? "");
  const [kazanimCode, setKazanimCode] = useState(entry?.kazanim_code ?? "");
  const [pending, setPending] = useState(false);
  const isEditing = Boolean(entry);
  const kazanimlar = kazanimlarBySubject[subject] ?? [];

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
        {isEditing ? (
          <Button type="button" variant="outline" size="sm" className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            Düzenle
          </Button>
        ) : (
          <Button>Programa Ekle</Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Çalışma Programını Düzenle" : "Çalışma Programına Ekle"}
          </DialogTitle>
        </DialogHeader>
        <form
          action={async (formData) => {
            setPending(true);
            try {
              if (forCurrentStudent) {
                if (isEditing) {
                  await updateOwnScheduleEntry(formData);
                } else {
                  await createOwnScheduleEntry(formData);
                }
              } else {
                if (isEditing) await updateScheduleEntry(formData);
                else await createScheduleEntry(formData);
              }
              toast.success(
                isEditing ? "Program kaydı güncellendi." : "Program kaydı eklendi.",
              );
              setOpen(false);
              if (!isEditing) {
                setStartTime("");
                setEndTime("");
                setSubject("");
                setKazanimCode("");
              }
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Kaydedilemedi.");
            } finally {
              setPending(false);
            }
          }}
          className="flex flex-col gap-4"
        >
          {!forCurrentStudent && (
            <input type="hidden" name="student_id" value={studentId} />
          )}
          {isEditing && <input type="hidden" name="id" value={entry?.id} />}
          <input type="hidden" name="redirect_path" value={redirectPath} />
          <input type="hidden" name="day_of_week" value={dayOfWeek} />
          <input type="hidden" name="week_start" value={weekStart} />
          {forCurrentStudent && (
            <>
              <input type="hidden" name="subject" value={subject} />
              <input type="hidden" name="kazanim_code" value={kazanimCode} />
            </>
          )}

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

          {forCurrentStudent ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>Ders</Label>
                <Select
                  value={subject}
                  onValueChange={(value) => {
                    setSubject(value);
                    setKazanimCode("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ders seç" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Kazanım (opsiyonel)</Label>
                <Select
                  value={kazanimCode}
                  onValueChange={setKazanimCode}
                  disabled={!subject || kazanimlar.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !subject
                          ? "Önce ders seç"
                          : kazanimlar.length === 0
                            ? "Kazanım yok"
                            : "Kazanım seç"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {kazanimlar.map((kazanim) => (
                      <SelectItem key={kazanim.code} value={kazanim.code}>
                        {kazanim.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {kazanimCode && (
                  <button
                    type="button"
                    onClick={() => setKazanimCode("")}
                    className="self-start text-xs text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Kazanım seçimini temizle
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label htmlFor="activity_label">Ders/Konu</Label>
              <Input
                id="activity_label"
                name="activity_label"
                required
                placeholder="Örn: Matematik - Kesirler"
              />
            </div>
          )}

          <Button type="submit" disabled={pending || (forCurrentStudent && !subject)}>
            {pending ? "Kaydediliyor..." : isEditing ? "Değişiklikleri Kaydet" : "Kaydet"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
