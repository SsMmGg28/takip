import { Suspense } from "react";
import { requireRole } from "@/lib/auth";
import { getDashboardData, getSavedLayout } from "@/lib/dashboard";
import { DashboardHomeStream } from "@/components/dashboard/dashboard-home";
import { DashboardLoading } from "@/components/dashboard-loading";

export const metadata = { title: "Öğrenci Paneli" };

export default async function StudentHomePage() {
  // Rol koruması ve kayıtlı düzen birbirinden bağımsız: tek dalgada çözülür.
  const [profile, layout] = await Promise.all([
    requireRole(["student"]),
    getSavedLayout(),
  ]);
  // await YOK: dashboard verisi Suspense içinde akar.
  const data = getDashboardData(profile, layout);

  return (
    <div data-guide-anchor="dashboard-main">
      <Suspense fallback={<DashboardLoading />}>
        <DashboardHomeStream data={data} initialLayout={layout} />
      </Suspense>
    </div>
  );
}
