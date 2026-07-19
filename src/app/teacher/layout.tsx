import { Suspense } from "react";
import { DashboardShellGate, ShellSkeleton } from "@/components/dashboard-shell";

// Cache Components: requireRole (runtime API) Suspense içinde akar; layout'un
// kendisi statik kabukta kalır.
export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <DashboardShellGate role="teacher">{children}</DashboardShellGate>
    </Suspense>
  );
}
