"use client";

import { ErrorState } from "@/components/error-pages";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <ErrorState
          error={error}
          retry={unstable_retry}
          homeHref="/"
          homeLabel="Ana sayfaya dön"
        />
      </div>
    </main>
  );
}
