import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["teacher"]);

  return (
    <DashboardShell role="teacher" profile={profile}>
      {children}
    </DashboardShell>
  );
}
