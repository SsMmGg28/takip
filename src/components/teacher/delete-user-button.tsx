"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

/** Öğretmenin bir öğrenci/veli hesabını kalıcı olarak silmesi (onaylı). */
export function DeleteUserButton({
  userId,
  fullName,
  role,
}: {
  userId: string;
  fullName: string;
  role: "student" | "parent";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Hesap silinemedi.");
        return;
      }
      toast.success("Hesap silindi.");
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
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
          <DialogTitle>Hesabı Sil</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <p className="text-sm">
            <span className="font-medium">{fullName}</span> hesabı kalıcı olarak
            silinecek.
            {role === "student"
              ? " Öğrencinin ödevleri, denemeleri ve kitap ilerlemesi de silinir."
              : " Velinin çocuk bağlantıları kaldırılır; girdiği denemeler öğretmene devredilerek korunur."}{" "}
            Bu işlem geri alınamaz.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Vazgeç
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? "Siliniyor..." : "Kalıcı Olarak Sil"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
