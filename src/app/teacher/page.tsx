import { Suspense } from "react";
import { requireRole } from "@/lib/auth";
import { getDashboardData, getSavedLayout } from "@/lib/dashboard";
import { DashboardHomeStream } from "@/components/dashboard/dashboard-home";
import { DashboardLoading } from "@/components/dashboard-loading";

export const metadata = { title: "Öğretmen Paneli" };

export default async function TeacherHomePage() {
  // Rol koruması ve kayıtlı düzen birbirinden bağımsız: tek dalgada çözülür.
  const [profile, layout] = await Promise.all([
    requireRole(["teacher"]),
    getSavedLayout(),
  ]);
  // await YOK: dashboard verisi Suspense içinde akar.
  const data = getDashboardData(profile, layout);

  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardHomeStream data={data} initialLayout={layout} />
    </Suspense>
  );
}
