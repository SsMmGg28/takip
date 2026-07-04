"use client";

import { useState, useTransition } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
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
  deleteHomework,
  deleteHomeworkGroup,
  reassignMissingTests,
} from "@/app/teacher/homework/actions";

/** Kısayol: kontrolde eksik kalan testleri yeni bir ödev olarak gönderir. */
export function ReassignMissingButton({
  homeworkId,
  missingCount,
}: {
  homeworkId: string;
  missingCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 border-warning/50 text-warning hover:bg-warning/10 hover:text-warning"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Eksikleri Yeniden Gönder
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Eksik Testleri Yeniden Gönder</DialogTitle>
        </DialogHeader>
        <form
          action={async (formData) => {
            formData.set("id", homeworkId);
            setPending(true);
            try {
              await reassignMissingTests(formData);
              toast.success(
                `${missingCount} eksik test yeni ödev olarak gönderildi.`,
              );
              setOpen(false);
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Bir hata oluştu.");
            } finally {
              setPending(false);
            }
          }}
          className="flex flex-col gap-4"
        >
          <p className="text-sm text-muted-foreground">
            Yapılmayan <strong>{missingCount} test</strong>, aynı öğrenciye
            &quot;Eksikler&quot; başlıklı yeni bir ödev olarak gönderilecek ve
            bildirim düşecek.
          </p>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reassign-due">Yeni teslim tarihi (opsiyonel)</Label>
            <Input id="reassign-due" name="due_date" type="date" />
          </div>
          <Button type="submit" disabled={pending} className="gap-1.5">
            <RotateCcw className="h-4 w-4" />
            {pending ? "Gönderiliyor..." : "Yeniden Gönder"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteHomeworkButton({ homeworkId }: { homeworkId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      className="gap-1.5 text-muted-foreground hover:text-destructive"
      onClick={() => {
        if (!window.confirm("Bu ödev silinecek. Emin misin?")) return;
        const fd = new FormData();
        fd.set("id", homeworkId);
        startTransition(async () => {
          try {
            await deleteHomework(fd);
            toast.success("Ödev silindi.");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Bir hata oluştu.");
          }
        });
      }}
    >
      <Trash2 className="h-3.5 w-3.5" /> Sil
    </Button>
  );
}

/** Toplu gönderimi tüm öğrencilerden kaldırır. */
export function DeleteHomeworkGroupButton({
  groupId,
  studentCount,
}: {
  groupId: string;
  studentCount: number;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      className="gap-1.5 text-muted-foreground hover:text-destructive"
      onClick={() => {
        if (
          !window.confirm(
            `Bu ödev ${studentCount} öğrencinin tamamından silinecek. Emin misin?`,
          )
        ) {
          return;
        }
        const fd = new FormData();
        fd.set("group_id", groupId);
        startTransition(async () => {
          try {
            await deleteHomeworkGroup(fd);
            toast.success("Toplu ödev silindi.");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Bir hata oluştu.");
          }
        });
      }}
    >
      <Trash2 className="h-3.5 w-3.5" /> Tümünü Sil
    </Button>
  );
}
