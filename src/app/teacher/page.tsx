import { requireRole } from "@/lib/auth";
import { getDashboardData, getSavedLayout } from "@/lib/dashboard";
import { DashboardHome } from "@/components/dashboard/dashboard-home";

export const metadata = { title: "Öğretmen Paneli" };

export default async function TeacherHomePage() {
  const profile = await requireRole(["teacher"]);
  const layout = await getSavedLayout();
  const data = await getDashboardData(profile, layout);

  return <DashboardHome data={data} initialLayout={layout} />;
}
