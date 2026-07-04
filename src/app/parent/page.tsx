import { requireRole } from "@/lib/auth";
import { getDashboardData, getSavedLayout } from "@/lib/dashboard";
import { CustomizableDashboard } from "@/components/dashboard/customizable-dashboard";

export default async function ParentHomePage() {
  const profile = await requireRole(["parent"]);
  const [data, layout] = await Promise.all([getDashboardData(profile), getSavedLayout()]);

  return <CustomizableDashboard data={data} initialLayout={layout} />;
}
