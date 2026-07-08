"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { completePasswordSetup } from "@/lib/actions/account";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı.`);
      return;
    }
    if (password !== confirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    setLoading(true);

    // Parola uzunluğu ve profil güncellemesi sunucuda (server action) yapılır;
    // istemci uzunluk kontrolü yalnızca UX içindir. Rolü çekip doğrudan panele
    // gidiyoruz; profil okunamazsa "/" middleware tarafından çözülür.
    const result = await completePasswordSetup(password);

    if (!result.ok) {
      setLoading(false);
      setError(result.error ?? "Şifre güncellenemedi, lütfen tekrar deneyin.");
      return;
    }

    router.push(result.role ? `/${result.role}` : "/");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="animate-blob absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
        <div
          className="animate-blob absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-brand-to/15 blur-3xl"
          style={{ animationDelay: "-6s" }}
        />
      </div>
      <div className="absolute right-4 top-4 animate-fade-in">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm animate-fade-up">
        <div className="mb-6 flex justify-center">
          <Brand size="lg" />
        </div>
        <Card className="glass border-border/60 shadow-2xl shadow-primary/10">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="gradient-surface flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md shadow-primary/25">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">
                Yeni <span className="gradient-text">Şifre</span> Belirle
              </h1>
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
                <p className="text-xs text-muted-foreground">
                  En az {MIN_PASSWORD_LENGTH} karakter.
                </p>
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
