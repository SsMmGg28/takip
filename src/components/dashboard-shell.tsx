import Link from "next/link";
import { MobileNav } from "@/components/dashboard-nav";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { NotificationsBell } from "@/components/notifications-bell";
import { ServiceWorkerRegistrar } from "@/components/push-manager";
import { SignOutButton } from "@/components/sign-out-button";
import { Brand } from "@/components/brand";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireRole } from "@/lib/auth";
import { getAccessibleStudentsWithGrades, getStudentGrade } from "@/lib/students";
import { examsEnabledForGrade } from "@/lib/kazanim";
import type { Profile, Role } from "@/lib/types";

/** Deneme sekmesi yalnızca 7-8. sınıf bağlamında gösterilir. */
async function shouldShowExams(role: Role, profile: Profile): Promise<boolean> {
  if (role === "teacher") return true;
  if (role === "student") {
    return examsEnabledForGrade(await getStudentGrade(profile.id));
  }
  const students = await getAccessibleStudentsWithGrades(profile);
  return students.some((s) => examsEnabledForGrade(s.grade_level));
}

const ROLE_LABELS: Record<Role, string> = {
  teacher: "Öğretmen",
  student: "Öğrenci",
  parent: "Veli",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("tr-TR"))
    .join("");
}

export async function DashboardShell({
  role,
  profile,
  children,
}: {
  role: Role;
  profile: Profile;
  children: React.ReactNode;
}) {
  const showExams = await shouldShowExams(role, profile);

  return (
    <div className="relative min-h-screen">
      <ServiceWorkerRegistrar />
      {/* Dekoratif arka plan ışıltıları */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="animate-blob absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div
          className="animate-blob absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-brand-to/10 blur-3xl"
          style={{ animationDelay: "-8s" }}
        />
      </div>

      <header className="glass sticky top-0 z-30 border-b">
        <span className="gradient-surface block h-0.5" />
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
          <Brand size="sm" />
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Kullanıcı rozeti profil sayfasına gider: mobilde yalnızca avatar, sm+ ekranda ad/rol de görünür */}
            <Link
              href={`/${role}/profile`}
              className="flex items-center gap-2 rounded-full border bg-card/60 p-1 shadow-sm transition-colors hover:bg-accent sm:pr-3"
              title={`${profile.full_name} — ${ROLE_LABELS[role]} · Profilim`}
            >
              <span className="gradient-surface flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white">
                {initials(profile.full_name)}
              </span>
              <span className="hidden max-w-48 truncate text-xs leading-tight sm:block sm:text-sm">
                <span className="block truncate font-medium">{profile.full_name}</span>
                <span className="block text-[10px] text-muted-foreground sm:text-xs">
                  {ROLE_LABELS[role]}
                </span>
              </span>
            </Link>
            <NotificationsBell userId={profile.id} />
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* sm+ ekranda içerik, açılıp kapanabilen yan menüyle yan yana akar */}
      <div className="mx-auto flex w-full max-w-7xl sm:gap-4 sm:px-6 sm:pt-6">
        <DashboardSidebar role={role} showExams={showExams} />
        <main className="animate-fade-up min-w-0 flex-1 space-y-6 p-4 pb-28 sm:p-0 sm:pb-10">
          {children}
        </main>
      </div>

      <MobileNav role={role} showExams={showExams} />
    </div>
  );
}

/**
 * Rol layout'ları için giriş kapısı: requireRole (cookies → runtime API)
 * burada çalışır; Cache Components'ta layout'un kendisi sync kalır ve bu
 * bileşen Suspense içinde akar.
 */
export async function DashboardShellGate({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const profile = await requireRole([role]);
  return (
    <DashboardShell role={role} profile={profile}>
      {children}
    </DashboardShell>
  );
}

/** Kabuk yüklenirken gösterilen tam sayfa iskelet (statik kabuğa gömülür). */
export function ShellSkeleton() {
  return (
    <div className="relative min-h-screen">
      <header className="glass sticky top-0 z-30 border-b">
        <span className="gradient-surface block h-0.5" />
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
          <Brand size="sm" />
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Skeleton className="h-9 w-9 rounded-full sm:w-40" />
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-7xl sm:gap-4 sm:px-6 sm:pt-6">
        <main className="min-w-0 flex-1 space-y-6 p-4 pb-28 sm:p-0 sm:pb-10">
          <div className="flex flex-col gap-2 pb-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </main>
      </div>
    </div>
  );
}
