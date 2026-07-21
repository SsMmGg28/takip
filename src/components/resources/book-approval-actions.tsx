"use client";

import { useTransition } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { approveBook, rejectBook } from "@/lib/actions/resources";

/** Öğretmen: bekleyen kitap için onayla / reddet butonları. */
export function BookApprovalActions({
  bookId,
  bookName,
}: {
  bookId: string;
  bookName: string;
}) {
  const [pending, startTransition] = useTransition();

  function run(action: (fd: FormData) => Promise<void>, successMessage: string) {
    if (!window.confirm(`“${bookName}” için bu işlemi kesinleştirmek istiyor musunuz?`)) {
      return;
    }
    const fd = new FormData();
    fd.set("id", bookId);
    startTransition(async () => {
      try {
        await action(fd);
        toast.success(successMessage);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Bir hata oluştu.");
      }
    });
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => run(rejectBook, `"${bookName}" reddedildi.`)}
        className="gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <X className="h-3.5 w-3.5" /> Reddet
      </Button>
      <Button
        size="sm"
        disabled={pending}
        onClick={() => run(approveBook, `"${bookName}" kütüphaneye eklendi.`)}
        className="gap-1"
      >
        <Check className="h-3.5 w-3.5" /> Onayla
      </Button>
    </div>
  );
}
