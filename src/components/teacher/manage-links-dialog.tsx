"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface LinkStudentOption {
  id: string;
  fullName: string;
}

/** Öğretmenin bir velinin çocuk bağlantılarını yönetmesi (ekle/kaldır). */
export function ManageLinksDialog({
  parentId,
  parentName,
  linkedStudents,
  allStudents,
}: {
  parentId: string;
  parentName: string;
  linkedStudents: LinkStudentOption[];
  allStudents: LinkStudentOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState("");

  const linkedIds = new Set(linkedStudents.map((s) => s.id));
  const addable = allStudents.filter((s) => !linkedIds.has(s.id));

  async function mutate(studentId: string, action: "add" | "remove") {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/manage-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parent_id: parentId, student_id: studentId, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "İşlem tamamlanamadı.");
        return;
      }
      toast.success(action === "add" ? "Çocuk bağlandı." : "Bağlantı kaldırıldı.");
      setSelected("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Link2 className="h-3.5 w-3.5" />
          Çocuklar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{parentName} — Çocuk Bağlantıları</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Bağlı çocuklar
            </p>
            {linkedStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz çocuk bağlanmadı.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {linkedStudents.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                  >
                    <span>{s.fullName}</span>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => mutate(s.id, "remove")}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                      aria-label={`${s.fullName} bağlantısını kaldır`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Çocuk ekle
            </p>
            <div className="flex gap-2">
              <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Öğrenci seç" />
                </SelectTrigger>
                <SelectContent>
                  {addable.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                disabled={loading || !selected}
                onClick={() => mutate(selected, "add")}
              >
                Ekle
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
