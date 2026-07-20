"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

/**
 * error.tsx dosyalarının ortak gövdesi. Next 16.2'de kurtarma için
 * `unstable_retry` önerilir (reset yalnızca state temizler, sunucu bileşeni
 * hatalarından kurtaramaz); route dosyaları onu `retry` olarak geçirir.
 */
export function ErrorState({
  error,
  retry,
  homeHref,
  homeLabel,
}: {
  error: Error & { digest?: string };
  retry: () => void;
  homeHref: string;
  homeLabel: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      icon={AlertTriangle}
      title="Bir şeyler ters gitti"
      description={
        <>
          Beklenmedik bir hata oluştu. Sorun sürerse öğretmenine haber ver.
          {error.digest && (
            <span className="mt-1 block text-xs text-muted-foreground/70">
              Hata kodu: {error.digest}
            </span>
          )}
        </>
      }
      action={
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button onClick={() => retry()}>
            <RotateCcw className="h-4 w-4" />
            Tekrar dene
          </Button>
          <Button variant="outline" asChild>
            <Link href={homeHref}>
              <Home className="h-4 w-4" />
              {homeLabel}
            </Link>
          </Button>
        </div>
      }
    />
  );
}

/** not-found.tsx dosyalarının ortak gövdesi. */
export function NotFoundState({
  homeHref,
  homeLabel,
}: {
  homeHref: string;
  homeLabel: string;
}) {
  return (
    <EmptyState
      icon={SearchX}
      title="Sayfa bulunamadı"
      description="Aradığın sayfa taşınmış ya da hiç var olmamış olabilir."
      action={
        <Button variant="outline" asChild>
          <Link href={homeHref}>
            <Home className="h-4 w-4" />
            {homeLabel}
          </Link>
        </Button>
      }
    />
  );
}
