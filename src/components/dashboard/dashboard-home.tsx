import { DashboardHomeParent } from "@/components/dashboard/dashboard-home-parent";
import { DashboardHomeStudent } from "@/components/dashboard/dashboard-home-student";
import { DashboardHomeTeacher } from "@/components/dashboard/dashboard-home-teacher";
import { normalizeDashboardLayout } from "@/lib/dashboard-layout";
import type { DashboardData, StoredLayout } from "@/lib/dashboard-types";

/**
 * Rol seçimi sunucuda yapılır: her rol yalnız kendi client chunk'ını indirir
 * (öğrenci, öğretmen diyaloglarının kodunu almaz — bundle bölme burada başlar).
 */
export function DashboardHome({
  data,
  initialLayout,
}: {
  data: DashboardData;
  initialLayout: StoredLayout | null;
}) {
  const studentIds = data.role === "parent" ? data.children.map((child) => child.id) : [];
  const layout = normalizeDashboardLayout(data.role, initialLayout, studentIds);
  if (data.role === "student")
    return <DashboardHomeStudent data={data} initialLayout={layout} />;
  if (data.role === "teacher")
    return <DashboardHomeTeacher data={data} initialLayout={layout} />;
  return <DashboardHomeParent data={data} initialLayout={layout} />;
}

/**
 * Dashboard sayfalarının akış sarmalayıcısı: sayfa veriyi await etmeden promise
 * olarak geçirir, veri burada Suspense sınırının içinde çözülür (ev deseni:
 * student/homework sayfasındaki HomeworkResults).
 */
export async function DashboardHomeStream({
  data,
  initialLayout,
}: {
  data: Promise<DashboardData>;
  initialLayout: StoredLayout | null;
}) {
  return <DashboardHome data={await data} initialLayout={initialLayout} />;
}
