import { requireRole } from "@/lib/auth";
import { getDashboardData, getSavedLayout } from "@/lib/dashboard";
import { DashboardHome } from "@/components/dashboard/dashboard-home";

export const metadata = { title: "Veli Paneli" };

export default async function ParentHomePage() {
  const profile = await requireRole(["parent"]);
  const layout = await getSavedLayout();
  const data = await getDashboardData(profile, layout);

  return <DashboardHome data={data} initialLayout={layout} />;
}
