import { Suspense } from "react";
import Link from "next/link";
import { MobileNav, MobileNavActive } from "@/components/dashboard-nav";
import { DashboardSidebar, DashboardSidebarActive } from "@/components/dashboard-sidebar";
import { NotificationsBell } from "@/components/notifications-bell";
import { ServiceWorkerRegistrar } from "@/components/push-manager";
import { SignOutButton } from "@/components/sign-out-button";
import { Brand } from "@/components/brand";
import { GuideRuntime } from "@/components/guides/guide-runtime";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { NoFlashThemeColorScript, ThemeColorSync } from "@/components/theme-color-sync";
import { getCurrentProfile, requireRole } from "@/lib/auth";
import { getAccessibleStudentsWithGrades, getStudentGrade } from "@/lib/students";
import { examsEnabledForGrade } from "@/lib/kazanim";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

/**
 * Deneme sekmesi yalnızca 7-8. sınıf bağlamında gösterilir. Öğretmen menüsü
 * kullanıcı verisine bakmadığından statik kabukta tam çizilir; öğrenci/veli
 * için sonuç Suspense içindeki nav adalarında çözülür.
 */
async function resolveShowExams(role: Role): Promise<boolean> {
  if (role === "teacher") return true;
  const profile = await getCurrentProfile();
  if (!profile) return false;
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

/**
 * Header'ın kullanıcıya bağlı adası: rol koruması (oturumsuz/yanlış rol →
 * redirect, stream içinde de çalışır), profil rozeti, bildirim zili ve aksan
 * tema rengi eşitleme. Kabuğun geri kalanını bekletmeden Suspense içinde akar.
 */
async function HeaderUserArea({ role }: { role: Role }) {
  const profile = await requireRole([role]);
  const supabase = await createClient();
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .is("read_at", null);

  return (
    <>
      <NoFlashThemeColorScript color={profile.theme_color} />
      <ThemeColorSync color={profile.theme_color} />
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
      <NotificationsBell userId={profile.id} initialUnreadCount={unreadCount ?? 0} />
    </>
  );
}

/** Kullanıcı adası akarken görünen yer tutucu (rozet + zil). */
function HeaderUserSkeleton() {
  return (
    <>
      <Skeleton className="h-9 w-9 rounded-full sm:w-40" />
      <Skeleton className="h-9 w-9 rounded-full" />
    </>
  );
}

/**
 * Nav adaları: deneme linki görünürlüğü (runtime verisi) Suspense içindeki bu
 * sunucu sarmalayıcılarda çözülür; istemci nav bileşenleri düz boolean alır.
 * Fallback'te aynı nav, deneme linki gizli hâliyle statik olarak boyanır.
 */
async function DashboardSidebarIsland({
  role,
  showExams,
}: {
  role: Role;
  showExams: Promise<boolean>;
}) {
  return <DashboardSidebarActive role={role} showExams={await showExams} />;
}

async function MobileNavIsland({
  role,
  showExams,
}: {
  role: Role;
  showExams: Promise<boolean>;
}) {
  return <MobileNavActive role={role} showExams={await showExams} />;
}

/**
 * Statik kabuk: header çerçevesi, yan menü, mobil alt bar ve içerik alanı
 * PPR statik kabuğunda anında boyanır. Kullanıcı verisi gerektiren parçalar
 * (profil rozeti, bildirim zili, deneme sekmesi görünürlüğü) Suspense adaları
 * olarak sonradan akar; sayfa içeriği kendi `loading.tsx` sınırında yüklenir.
 */
export function DashboardChrome({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  // await YOK: görünürlük promise'i Suspense içindeki nav adalarında çözülür.
  const showExams = resolveShowExams(role);

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
            <Suspense fallback={<HeaderUserSkeleton />}>
              <HeaderUserArea role={role} />
            </Suspense>
            {role !== "teacher" && (
              <Suspense fallback={<Skeleton className="h-10 w-10 rounded-full" />}>
                <GuideRuntime role={role} />
              </Suspense>
            )}
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* sm+ ekranda içerik, açılıp kapanabilen yan menüyle yan yana akar */}
      <div className="mx-auto flex w-full max-w-7xl sm:gap-4 sm:px-6 sm:pt-6">
        <Suspense fallback={<DashboardSidebar role={role} showExams={false} />}>
          <DashboardSidebarIsland role={role} showExams={showExams} />
        </Suspense>
        <main className="animate-fade-up min-w-0 flex-1 space-y-6 p-4 pb-28 sm:p-0 sm:pb-10">
          {children}
        </main>
      </div>

      <Suspense fallback={<MobileNav role={role} showExams={false} />}>
        <MobileNavIsland role={role} showExams={showExams} />
      </Suspense>
    </div>
  );
}
