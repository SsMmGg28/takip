import { requireRole } from "@/lib/auth";
import { getDashboardData, getSavedLayout } from "@/lib/dashboard";
import { CustomizableDashboard } from "@/components/dashboard/customizable-dashboard";

export const metadata = { title: "Öğretmen Paneli" };

export default async function TeacherHomePage() {
  const profile = await requireRole(["teacher"]);
  const [data, layout] = await Promise.all([getDashboardData(profile), getSavedLayout()]);

  return <CustomizableDashboard data={data} initialLayout={layout} />;
}
