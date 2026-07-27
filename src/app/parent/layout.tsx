import { DashboardChrome } from "@/components/dashboard-shell";

// Statik kabuk: header/menü PPR kabuğunda anında boyanır. Kullanıcıya bağlı
// parçalar (rol koruması dahil) kabuk içindeki Suspense adalarında, sayfa
// içeriği kendi loading.tsx sınırında akar.
export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return <DashboardChrome role="parent">{children}</DashboardChrome>;
}
