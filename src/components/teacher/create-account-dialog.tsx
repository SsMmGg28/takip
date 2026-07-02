"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Profile } from "@/lib/types";

export function CreateAccountDialog({ students }: { students: Profile[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<"student" | "parent">("student");
  const [fullName, setFullName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [parentOf, setParentOf] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ username: string; tempPassword: string } | null>(null);

  function resetForm() {
    setFullName("");
    setGradeLevel("");
    setParentOf("");
    setError(null);
    setResult(null);
    setRole("student");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (role === "parent" && !parentOf) {
      setError("Velinin hangi öğrenciye ait olduğunu seçmelisin.");
      return;
    }
    if (role === "student" && !gradeLevel) {
      setError("Öğrencinin sınıf düzeyini seçmelisin.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        role,
        grade_level: gradeLevel ? Number(gradeLevel) : undefined,
        parent_of: role === "parent" ? parentOf : undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Bir hata oluştu.");
      return;
    }

    setResult(data);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button>Yeni Hesap Oluştur</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Hesap Oluştur</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm">
              Hesap oluşturuldu. Bu bilgileri WhatsApp ile iletip kullanıcının ilk girişte
              şifresini değiştirmesini iste.
            </p>
            <div className="rounded-md border bg-muted p-3 text-sm">
              <p>
                <span className="font-medium">Kullanıcı adı:</span> {result.username}
              </p>
              <p>
                <span className="font-medium">Geçici şifre:</span> {result.tempPassword}
              </p>
            </div>
            <Button onClick={() => setOpen(false)}>Kapat</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Hesap türü</Label>
              <Select value={role} onValueChange={(v) => setRole(v as "student" | "parent")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Öğrenci</SelectItem>
                  <SelectItem value="parent">Veli</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="full_name">Ad Soyad</Label>
              <Input
                id="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            {role === "student" && (
              <div className="flex flex-col gap-2">
                <Label>Sınıf düzeyi *</Label>
                <Select value={gradeLevel} onValueChange={setGradeLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sınıf seç" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5. Sınıf</SelectItem>
                    <SelectItem value="6">6. Sınıf</SelectItem>
                    <SelectItem value="7">7. Sınıf</SelectItem>
                    <SelectItem value="8">8. Sınıf</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Deneme takibi yalnızca 7. ve 8. sınıflar için açılır.
                </p>
              </div>
            )}

            {role === "parent" && (
              <div className="flex flex-col gap-2">
                <Label>Hangi öğrencinin velisi?</Label>
                <Select value={parentOf} onValueChange={setParentOf}>
                  <SelectTrigger>
                    <SelectValue placeholder="Öğrenci seç" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={loading}>
              {loading ? "Oluşturuluyor..." : "Oluştur"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
