"use client";

import { useState } from "react";
import { Bell, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  copyWeekToCurrent,
  notifyScheduleAssigned,
  setOwnScheduleAutoRepeat,
} from "@/lib/actions/schedule";
import { formatWeekRange } from "@/lib/week";

/** Arşivdeki haftayı güncel haftaya kopyalar (onaylı; mevcut hafta değiştirilir). */
export function CopyWeekButton({
  studentId,
  fromWeek,
}: {
  studentId: string;
  fromWeek: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleCopy() {
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("student_id", studentId);
      fd.set("from_week", fromWeek);
      await copyWeekToCurrent(fd);
      toast.success("Program bu haftaya kopyalandı.");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kopyalanamadı.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-1.5">
          <Copy className="h-4 w-4" />
          Bu Haftaya Kopyala
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Programı Bu Haftaya Kopyala</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <p className="text-sm">
            <span className="font-medium">{formatWeekRange(fromWeek)}</span> haftasının
            programı güncel haftaya kopyalanacak. Bu haftada mevcut kayıt varsa silinip
            yerine yazılır.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Vazgeç
            </Button>
            <Button onClick={handleCopy} disabled={pending}>
              {pending ? "Kopyalanıyor..." : "Kopyala"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Görüntülenen haftanın programını öğrenci + veliye tek bildirimle duyurur. */
export function NotifyScheduleButton({
  studentId,
  weekStart,
}: {
  studentId: string;
  weekStart: string;
}) {
  const [pending, setPending] = useState(false);

  async function handleNotify() {
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("student_id", studentId);
      fd.set("week_start", weekStart);
      await notifyScheduleAssigned(fd);
      toast.success("Program öğrenciye ve velisine bildirildi.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bildirim gönderilemedi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button onClick={handleNotify} disabled={pending} className="gap-1.5">
      <Bell className="h-4 w-4" />
      {pending ? "Bildiriliyor..." : "Programı Bildir"}
    </Button>
  );
}

/** Öğrencinin "program her hafta otomatik devam etsin" tercihi. */
export function AutoRepeatToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, setPending] = useState(false);

  async function toggle(next: boolean) {
    setEnabled(next);
    setPending(true);
    try {
      await setOwnScheduleAutoRepeat(next);
      toast.success(
        next
          ? "Program artık her hafta otomatik devam edecek."
          : "Otomatik devam kapatıldı; yeni hafta boş başlar.",
      );
    } catch (e) {
      setEnabled(!next);
      toast.error(e instanceof Error ? e.message : "Ayar kaydedilemedi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm shadow-sm">
      <Checkbox
        checked={enabled}
        disabled={pending}
        onCheckedChange={(v) => toggle(v === true)}
      />
      <span>
        Her hafta otomatik devam
        <span className="block text-xs text-muted-foreground">
          Kapalıysa yeni hafta boş başlar (varsayılan).
        </span>
      </span>
    </label>
  );
}
