"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bug } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createBugReport } from "@/lib/actions/bug-reports";

/** Tüm rollerin erişebildiği hata bildirme diyaloğu (profil sayfasında). */
export function BugReportDialog() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const fd = new FormData();
      fd.set("description", description);
      fd.set("page", pathname);
      const result = await createBugReport(fd);
      if (!result.ok) {
        toast.error(result.error ?? "Bildirim gönderilemedi.");
        return;
      }
      toast.success("Bildirimin iletildi, teşekkürler!");
      setDescription("");
      setOpen(false);
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-1.5">
          <Bug className="h-4 w-4" />
          Hata Bildir
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Hata Bildir</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Karşılaştığın sorunu kısaca anlat; bildirimin öğretmene ve sistem
            yöneticisine anında iletilir.
          </p>
          <div className="flex flex-col gap-2">
            <Label htmlFor="bug-description">Sorunun açıklaması</Label>
            <Textarea
              id="bug-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Örn: Ödev sayfasında İndir düğmesine basınca hata alıyorum."
              required
            />
          </div>
          <Button type="submit" disabled={sending}>
            {sending ? "Gönderiliyor..." : "Gönder"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
