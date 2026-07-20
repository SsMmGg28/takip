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
    <div className="mx-auto w-full max-w-md py-10">
      <ErrorState
        error={error}
        retry={unstable_retry}
        homeHref="/parent"
        homeLabel="Panele dön"
      />
    </div>
  );
}
