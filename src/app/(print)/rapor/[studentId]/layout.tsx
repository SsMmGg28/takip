import { requireRole } from "@/lib/auth";

/**
 * Yazdırılabilir rapor düzeni: uygulama kabuğu (DashboardShell) YOK — yalnız kök
 * layout'un font/tema'sını miras alır. Erişim öğretmene kısıtlı.
 */
export default async function ReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["teacher"]);
  return <div className="mx-auto max-w-3xl px-4 py-6 print:max-w-none print:p-0">{children}</div>;
}
