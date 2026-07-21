"use client";

import { useState, useTransition } from "react";
import { Check, Trash2 } from "lucide-react";
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
import { AddScheduleEntryDialog } from "@/components/schedule/add-schedule-entry-dialog";
import { completeOwnScheduleEntry, deleteOwnScheduleEntry } from "@/lib/actions/schedule";
import type { Kazanim } from "@/lib/kazanim";
import type { StudyScheduleEntry } from "@/lib/types";

function CompleteScheduleEntryDialog({ entry }: { entry: StudyScheduleEntry }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [startHours, startMinutes] = entry.start_time.split(":").map(Number);
  const [endHours, endMinutes] = entry.end_time.split(":").map(Number);
  const scheduledMinutes = endHours * 60 + endMinutes - (startHours * 60 + startMinutes);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="sm"
          className="gap-1.5"
          disabled={!entry.subject}
          title={entry.subject ? undefined : "Önce ders seçerek kaydı düzenle."}
        >
          <Check className="h-3.5 w-3.5" />
          Tamamla
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Çalışmayı Tamamla</DialogTitle>
        </DialogHeader>
        <form
          action={async (formData) => {
            setPending(true);
            try {
              await completeOwnScheduleEntry(formData);
              toast.success("Çalışma günlüğüne eklendi.");
              setOpen(false);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Kaydedilemedi.");
            } finally {
              setPending(false);
            }
          }}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="id" value={entry.id} />
          <p className="text-sm text-muted-foreground">
            {entry.subject}
            {entry.kazanim_name ? ` · ${entry.kazanim_name}` : ""} çalışmanı günlüğüne
            kaydet. Süre, programdaki saatlerden otomatik hesaplanır.
          </p>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`schedule-question-count-${entry.id}`}>
              Soru sayısı (opsiyonel)
            </Label>
            <Input
              id={`schedule-question-count-${entry.id}`}
              name="question_count"
              type="number"
              min={0}
              max={2000}
              inputMode="numeric"
              placeholder="Örn: 20"
            />
          </div>
          <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            Programa göre:{" "}
            <strong className="text-foreground">{scheduledMinutes} dk</strong>
          </p>
          <Button type="submit" disabled={pending}>
            {pending ? "Kaydediliyor..." : "Günlüğe Kaydet"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Öğrencinin kendi program kaydındaki düzenle, sil ve tamamla işlemleri. */
export function StudentScheduleEntryActions({
  entry,
  redirectPath,
  subjects,
  kazanimlarBySubject,
  entries,
}: {
  entry: StudyScheduleEntry;
  redirectPath: string;
  subjects: string[];
  kazanimlarBySubject: Record<string, Kazanim[]>;
  entries: StudyScheduleEntry[];
}) {
  const [pending, startTransition] = useTransition();

  function remove() {
    const formData = new FormData();
    formData.set("id", entry.id);
    startTransition(async () => {
      try {
        await deleteOwnScheduleEntry(formData);
        toast.success("Program kaydı silindi.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Silinemedi.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {entry.completed_at ? (
        <span className="rounded-full bg-success/10 px-2 py-1 text-xs font-medium text-success">
          Tamamlandı
        </span>
      ) : (
        <CompleteScheduleEntryDialog entry={entry} />
      )}
      <AddScheduleEntryDialog
        entry={entry}
        forCurrentStudent
        redirectPath={redirectPath}
        weekStart={entry.week_start}
        entries={entries}
        subjects={subjects}
        kazanimlarBySubject={kazanimlarBySubject}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        aria-label="Program kaydını sil"
        disabled={pending}
        onClick={remove}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
