"use client";

import "./globals.css";

/**
 * Kök layout/template hatalarında tüm sayfanın yerine geçer; bu yüzden kendi
 * <html>/<body>'sini kurar ve bağımlılığı en azda tutar (font/bileşen yok).
 */
export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="tr">
      <body className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground antialiased">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <h2 className="text-lg font-semibold">Uygulama yüklenirken bir hata oluştu</h2>
          <p className="text-sm text-muted-foreground">
            Beklenmedik bir sorun yaşandı. Sayfayı yeniden yüklemeyi dene.
          </p>
          <button
            onClick={() => unstable_retry()}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Yeniden yükle
          </button>
        </div>
      </body>
    </html>
  );
}
