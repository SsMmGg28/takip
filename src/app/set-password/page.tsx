"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Brand } from "@/components/brand";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalı.");
      return;
    }
    if (password !== confirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data: userData } = await supabase.auth.getUser();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setLoading(false);
      setError("Şifre güncellenemedi, lütfen tekrar deneyin.");
      return;
    }

    if (userData.user) {
      await supabase
        .from("profiles")
        .update({ must_change_password: false })
        .eq("id", userData.user.id);
    }

    setLoading(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_var(--accent),_transparent_55%)]" />
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Brand size="lg" />
        </div>
        <Card className="border-border/60 shadow-lg shadow-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h1 className="text-xl font-semibold">Yeni Şifre Belirle</h1>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Hesabını güvenceye almak için geçici şifreni değiştirmen gerekiyor.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Yeni şifre</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <p className="text-xs text-muted-foreground">En az 6 karakter.</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirm">Yeni şifre (tekrar)</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              {error && (
                <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" disabled={loading} className="w-full">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Kaydediliyor..." : "Şifreyi Kaydet"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
