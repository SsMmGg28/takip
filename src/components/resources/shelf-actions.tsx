"use client";

import { useTransition } from "react";
import { BookMarked, BookMinus, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  addBookToShelf,
  removeBookFromShelf,
  withdrawPendingBook,
} from "@/lib/actions/resources";

/** Veli: kütüphanedeki kitabı çocuğun kitaplığına ekler. */
export function AddToShelfButton({
  studentId,
  bookId,
  studentName,
}: {
  studentId: string;
  bookId: string;
  studentName: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      className="gap-1.5"
      onClick={() => {
        const fd = new FormData();
        fd.set("student_id", studentId);
        fd.set("book_id", bookId);
        startTransition(async () => {
          try {
            await addBookToShelf(fd);
            toast.success(`Kitap ${studentName} kitaplığına eklendi.`);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Bir hata oluştu.");
          }
        });
      }}
    >
      <BookMarked className="h-3.5 w-3.5" />
      {pending ? "Ekleniyor..." : "Kitaplığa Ekle"}
    </Button>
  );
}

/** Veli: kitabı çocuğun kitaplığından çıkarır (ilerleme silinmez). */
export function RemoveFromShelfButton({
  studentId,
  bookId,
}: {
  studentId: string;
  bookId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      className="gap-1.5 text-muted-foreground hover:text-destructive"
      onClick={() => {
        const fd = new FormData();
        fd.set("student_id", studentId);
        fd.set("book_id", bookId);
        startTransition(async () => {
          try {
            await removeBookFromShelf(fd);
            toast.success("Kitap kitaplıktan çıkarıldı. İlerleme kayıtları duruyor.");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Bir hata oluştu.");
          }
        });
      }}
    >
      <BookMinus className="h-3.5 w-3.5" />
      {pending ? "Çıkarılıyor..." : "Çıkar"}
    </Button>
  );
}

/** Veli: onay bekleyen kendi kitabını geri çeker. */
export function WithdrawPendingBookButton({ bookId }: { bookId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      className="gap-1.5 text-muted-foreground hover:text-destructive"
      onClick={() => {
        if (!window.confirm("Onay bekleyen bu kitap geri çekilecek. Emin misin?")) return;
        const fd = new FormData();
        fd.set("id", bookId);
        startTransition(async () => {
          try {
            await withdrawPendingBook(fd);
            toast.success("Kitap geri çekildi.");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Bir hata oluştu.");
          }
        });
      }}
    >
      <Undo2 className="h-3.5 w-3.5" />
      {pending ? "Geri çekiliyor..." : "Geri Çek"}
    </Button>
  );
}
