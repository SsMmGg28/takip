import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["student"]);

  return (
    <DashboardShell role="student" profile={profile}>
      {children}
    </DashboardShell>
  );
}
