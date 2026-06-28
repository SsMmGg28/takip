"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ResetPasswordButton({ profileId }: { profileId: string }) {
  const [open, setOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_id: profileId }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Bir hata oluştu.");
      return;
    }
    setTempPassword(data.tempPassword);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setTempPassword(null);
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Şifreyi Sıfırla
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Şifreyi Sıfırla</DialogTitle>
        </DialogHeader>
        {tempPassword ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm">Yeni geçici şifreyi WhatsApp ile ilet:</p>
            <div className="rounded-md border bg-muted p-3 text-sm font-medium">
              {tempPassword}
            </div>
            <Button onClick={() => setOpen(false)}>Kapat</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm">
              Bu kullanıcı için yeni bir geçici şifre oluşturulacak ve bir sonraki girişte şifre
              değiştirmesi zorunlu olacak. Onaylıyor musun?
            </p>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={handleReset} disabled={loading}>
              {loading ? "Sıfırlanıyor..." : "Onayla ve Sıfırla"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
