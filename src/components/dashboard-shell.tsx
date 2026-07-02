import { DashboardNav, MobileNav } from "@/components/dashboard-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Profile, Role } from "@/lib/types";

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

export function DashboardShell({
  role,
  profile,
  children,
}: {
  role: Role;
  profile: Profile;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
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
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Brand size="sm" />
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 rounded-full border bg-card/60 py-1 pl-1 pr-3 shadow-sm">
              <span className="gradient-surface flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-white">
                {initials(profile.full_name)}
              </span>
              <span className="max-w-28 truncate text-xs leading-tight sm:max-w-48 sm:text-sm">
                <span className="block truncate font-medium">{profile.full_name}</span>
                <span className="block text-[10px] text-muted-foreground sm:text-xs">
                  {ROLE_LABELS[role]}
                </span>
              </span>
            </div>
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
        <div className="mx-auto hidden max-w-6xl overflow-x-auto px-4 pb-3 sm:block">
          <DashboardNav role={role} />
        </div>
      </header>

      <main className="animate-fade-up mx-auto max-w-6xl space-y-6 p-4 pb-28 sm:p-6 sm:pb-10">
        {children}
      </main>

      <MobileNav role={role} />
    </div>
  );
}
