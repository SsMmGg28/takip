import { requireRole } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard-nav";
import { SignOutButton } from "@/components/sign-out-button";

const LINKS = [
  { href: "/parent", label: "Panel" },
  { href: "/parent/homework", label: "Ödevler" },
  { href: "/parent/resources", label: "Kaynaklar" },
  { href: "/parent/calendar", label: "Takvim" },
  { href: "/parent/schedule", label: "Çalışma Programı" },
  { href: "/parent/exams", label: "Deneme Analizi" },
];

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["parent"]);

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 p-4">
          <div>
            <p className="text-sm text-muted-foreground">Hoş geldin,</p>
            <p className="font-semibold">{profile.full_name}</p>
          </div>
          <DashboardNav links={LINKS} />
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4">{children}</main>
    </div>
  );
}
