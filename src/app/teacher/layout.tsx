import { DashboardChrome } from "@/components/dashboard-shell";

// Statik kabuk: header/menü PPR kabuğunda anında boyanır. Kullanıcıya bağlı
// parçalar (rol koruması dahil) kabuk içindeki Suspense adalarında, sayfa
// içeriği kendi loading.tsx sınırında akar.
export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return <DashboardChrome role="teacher">{children}</DashboardChrome>;
}
