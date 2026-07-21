import { DashboardHomeClient } from "@/components/dashboard/dashboard-home-client";
import { normalizeDashboardLayout } from "@/lib/dashboard-layout";
import type { DashboardData, StoredLayout } from "@/lib/dashboard-types";

export function DashboardHome({
  data,
  initialLayout,
}: {
  data: DashboardData;
  initialLayout: StoredLayout | null;
}) {
  const studentIds = data.role === "parent" ? data.children.map((child) => child.id) : [];
  const layout = normalizeDashboardLayout(data.role, initialLayout, studentIds);
  return <DashboardHomeClient data={data} initialLayout={layout} />;
}
