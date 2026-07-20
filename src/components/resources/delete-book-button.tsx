"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteBook } from "@/lib/actions/resources";

export function DeleteBookButton({
  bookId,
  bookName,
}: {
  bookId: string;
  bookName: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={() => {
        if (
          !window.confirm(
            `"${bookName}" kitabı, bölümleri ve tüm öğrencilerin bu kitaptaki ilerlemesiyle birlikte silinecek. Emin misin?`,
          )
        ) {
          return;
        }
        const fd = new FormData();
        fd.set("id", bookId);
        startTransition(async () => {
          try {
            await deleteBook(fd);
            toast.success("Kitap silindi.");
            router.push("/teacher/resources");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Bir hata oluştu.");
          }
        });
      }}
    >
      <Trash2 className="h-4 w-4" /> Kitabı Sil
    </Button>
  );
}
