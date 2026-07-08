"use client";

import { useState } from "react";
import { Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setTargetScore } from "@/lib/actions/exams";

/** Öğretmenin öğrenci için hedef deneme puanı belirlediği küçük diyalog. */
export function TargetScoreDialog({
  studentId,
  currentTarget,
}: {
  studentId: string;
  currentTarget: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [value, setValue] = useState(currentTarget?.toString() ?? "");

  async function save(clear = false) {
    const parsed = clear ? null : Number(value);
    if (!clear && (value.trim() === "" || Number.isNaN(parsed))) {
      toast.error("Geçerli bir puan gir.");
      return;
    }
    setPending(true);
    try {
      const result = await setTargetScore(studentId, parsed);
      if (!result.ok) {
        toast.error(result.error ?? "Hedef kaydedilemedi.");
        return;
      }
      toast.success(clear ? "Hedef puan kaldırıldı." : "Hedef puan kaydedildi.");
      if (clear) setValue("");
      setOpen(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-1.5">
          <Target className="h-4 w-4" />
          {currentTarget != null ? `Hedef: ${currentTarget}` : "Hedef Belirle"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Hedef Deneme Puanı</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Hedef, puan gelişim grafiğinde kesikli çizgi olarak öğrenciye ve
            veliye de görünür.
          </p>
          <div className="flex flex-col gap-2">
            <Label htmlFor="target-score">Hedef puan (0-500)</Label>
            <Input
              id="target-score"
              type="number"
              min={0}
              max={500}
              step="0.5"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Örn: 450"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              disabled={pending || currentTarget == null}
              onClick={() => save(true)}
            >
              Hedefi Kaldır
            </Button>
            <Button disabled={pending} onClick={() => save()}>
              {pending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
