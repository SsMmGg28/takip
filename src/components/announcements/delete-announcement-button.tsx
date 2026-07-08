"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteAnnouncement } from "@/lib/actions/announcements";

export function DeleteAnnouncementButton({
  announcementId,
  title,
}: {
  announcementId: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("id", announcementId);
      await deleteAnnouncement(fd);
      toast.success("Duyuru silindi.");
      setOpen(false);
    } catch {
      toast.error("Duyuru silinemedi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Sil
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Duyuruyu Sil</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <p className="text-sm">
            <span className="font-medium">&quot;{title}&quot;</span> duyurusu ve varsa
            ekli belgesi kalıcı olarak silinecek.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Vazgeç
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={pending}>
              {pending ? "Siliniyor..." : "Sil"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
