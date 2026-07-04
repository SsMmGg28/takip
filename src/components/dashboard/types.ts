import type { DashboardData } from "@/lib/dashboard-types";

/** Her widget bileşeninin aldığı ortak props: veri + mevcut boyut. */
export interface WidgetProps {
  data: DashboardData;
  /** Genişlik: masaüstü ızgarada kaç sütun (1-4). Mobilde 1 → yarım, 2+ → tam satır. */
  w: number;
  /** Yükseklik: kaç ızgara satırı (1-3). */
  h: number;
}
