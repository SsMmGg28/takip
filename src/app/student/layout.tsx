import { Suspense } from "react";
import { DashboardShellGate, ShellSkeleton } from "@/components/dashboard-shell";

// Cache Components: requireRole (runtime API) Suspense içinde akar; layout'un
// kendisi statik kabukta kalır.
export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <DashboardShellGate role="student">{children}</DashboardShellGate>
    </Suspense>
  );
}
