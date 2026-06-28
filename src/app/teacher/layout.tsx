import { requireRole } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard-nav";
import { SignOutButton } from "@/components/sign-out-button";

const LINKS = [
  { href: "/teacher", label: "Panel" },
  { href: "/teacher/students", label: "Öğrenciler" },
  { href: "/teacher/homework", label: "Ödevler" },
  { href: "/teacher/resources", label: "Kaynaklar" },
  { href: "/teacher/calendar", label: "Takvim" },
  { href: "/teacher/exams", label: "Deneme Analizi" },
];

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["teacher"]);

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
