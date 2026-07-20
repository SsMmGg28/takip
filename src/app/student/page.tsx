import { requireRole } from "@/lib/auth";
import { getDashboardData, getSavedLayout } from "@/lib/dashboard";
import { CustomizableDashboard } from "@/components/dashboard/customizable-dashboard";

export const metadata = { title: "Öğrenci Paneli" };

export default async function StudentHomePage() {
  const profile = await requireRole(["student"]);
  const [data, layout] = await Promise.all([getDashboardData(profile), getSavedLayout()]);

  return <CustomizableDashboard data={data} initialLayout={layout} />;
}
