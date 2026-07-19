import { Suspense } from "react";
import { requireRole } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";

/** requireRole (runtime API) Suspense içinde akar; Cache Components gereği. */
async function ReportGate({ children }: { children: React.ReactNode }) {
  await requireRole(["teacher"]);
  return <>{children}</>;
}

/**
 * Yazdırılabilir rapor düzeni: uygulama kabuğu (DashboardShell) YOK — yalnız kök
 * layout'un font/tema'sını miras alır. Erişim öğretmene kısıtlı.
 */
export default function ReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 print:max-w-none print:p-0">
      <Suspense
        fallback={
          <div className="flex flex-col gap-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        }
      >
        <ReportGate>{children}</ReportGate>
      </Suspense>
    </div>
  );
}
