"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { postAdmin } from "@/lib/admin-api";

/** Öğretmenin bir hesabın adını/telefonunu ve (öğrenciyse) sınıfını düzenlemesi. */
export function EditUserDialog({
  userId,
  role,
  initialFullName,
  initialPhone,
  initialGrade,
}: {
  userId: string;
  role: "student" | "parent";
  initialFullName: string;
  initialPhone: string | null;
  initialGrade?: number | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [grade, setGrade] = useState(initialGrade ? String(initialGrade) : "");

  async function save() {
    if (!fullName.trim()) {
      toast.error("Ad soyad boş olamaz.");
      return;
    }
    setLoading(true);
    try {
      const res = await postAdmin("update-user", {
        user_id: userId,
        full_name: fullName,
        phone,
        ...(role === "student" && grade ? { grade_level: Number(grade) } : {}),
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Hesap güncellendi.");
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Pencil className="h-3.5 w-3.5" />
          Düzenle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Hesabı Düzenle</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-full-name">Ad Soyad</Label>
            <Input
              id="edit-full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-phone">Telefon (isteğe bağlı)</Label>
            <Input
              id="edit-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05xx xxx xx xx"
            />
          </div>
          {role === "student" && (
            <div className="flex flex-col gap-2">
              <Label>Sınıf düzeyi</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Sınıf seç" />
                </SelectTrigger>
                <SelectContent>
                  {[5, 6, 7, 8].map((g) => (
                    <SelectItem key={g} value={String(g)}>
                      {g}. sınıf
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Deneme takibi 7-8. sınıflarda açılır; yıl sonunda sınıfı buradan
                yükseltebilirsin.
              </p>
            </div>
          )}
          <Button onClick={save} disabled={loading}>
            {loading ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
