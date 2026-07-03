import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["parent"]);

  return (
    <DashboardShell role="parent" profile={profile}>
      {children}
    </DashboardShell>
  );
}
