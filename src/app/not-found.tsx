import { NotFoundState } from "@/components/error-pages";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <NotFoundState homeHref="/" homeLabel="Ana sayfaya dön" />
      </div>
    </main>
  );
}
