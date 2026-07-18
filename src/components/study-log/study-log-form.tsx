"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { addStudyLog } from "@/lib/actions/study-log";

const PRESETS = [15, 30, 45, 60, 90];

/** Öğrenci: "Bugün ne çalıştın?" — ders + süre (dk) + opsiyonel not. */
export function StudyLogForm({ subjects }: { subjects: string[] }) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [minutes, setMinutes] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);

  const ready = Boolean(subject && Number(minutes) > 0);

  return (
    <form
      action={async (formData) => {
        if (!ready) return;
        setPending(true);
        try {
          await addStudyLog(formData);
          toast.success("Çalışma kaydedildi. 🔥");
          setMinutes("");
          setNote("");
          router.refresh();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Bir hata oluştu.");
        } finally {
          setPending(false);
        }
      }}
      className="flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-sm"
    >
      <input type="hidden" name="subject" value={subject} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label>Ders</Label>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="Ders seç" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="minutes">Süre (dakika)</Label>
          <Input
            id="minutes"
            name="minutes"
            type="number"
            min={1}
            max={1440}
            inputMode="numeric"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder="Örn: 30"
            className="bg-background"
            required
          />
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setMinutes(String(p))}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all active:scale-95",
                  minutes === String(p)
                    ? "gradient-surface border-transparent text-white shadow-sm shadow-primary/25"
                    : "border-input bg-background text-muted-foreground hover:bg-accent",
                )}
              >
                {p} dk
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="note">Not (opsiyonel)</Label>
        <Input
          id="note"
          name="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ne çalıştın, nasıl geçti?"
          className="bg-background"
        />
      </div>

      <Button type="submit" disabled={pending || !ready} className="gap-1.5 self-start">
        <Plus className="h-4 w-4" />
        {pending ? "Kaydediliyor..." : "Çalışmayı Kaydet"}
      </Button>
    </form>
  );
}
