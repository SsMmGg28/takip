"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { usernameToEmail } from "@/lib/username";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });

    if (signInError) {
      setLoading(false);
      setError("Kullanıcı adı veya şifre hatalı.");
      return;
    }

    // Rolü burada çekip doğrudan panele gidiyoruz; "/" üzerinden gitmek
    // middleware'de fazladan bir yönlendirme turu (2 ek Supabase çağrısı +
    // redirect) demekti. Profil okunamazsa "/"'a düşer, middleware çözer.
    // setLoading(false) çağrılmıyor: buton, yönlendirme tamamlanana kadar
    // dönmeye devam etsin.
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, must_change_password")
      .eq("id", data.user.id)
      .single();

    router.push(
      !profile
        ? "/"
        : profile.must_change_password
          ? "/set-password"
          : `/${profile.role}`,
    );
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Animasyonlu arka plan blobları */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="animate-blob absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
        <div
          className="animate-blob absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-brand-to/15 blur-3xl"
          style={{ animationDelay: "-6s" }}
        />
        <div
          className="animate-blob absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-brand-via/10 blur-3xl"
          style={{ animationDelay: "-11s" }}
        />
      </div>

      <div className="absolute left-4 top-4 animate-fade-in">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Ana sayfa
          </Link>
        </Button>
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
            <h1 className="text-2xl font-bold tracking-tight">
              Tekrar <span className="gradient-text">hoş geldin</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Öğretmen, öğrenci veya veli hesabınla devam et.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="username">Kullanıcı adı</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  placeholder="ornek.kullanici"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Şifre</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              {error && (
                <p className="animate-scale-in rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Şifreni unuttuysan öğretmeninle iletişime geç.
        </p>
      </div>
    </div>
  );
}
