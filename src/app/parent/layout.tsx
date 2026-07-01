import { requireRole } from "@/lib/auth";
import { DashboardNav, MobileBottomNav } from "@/components/dashboard-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["parent"]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3">
          <Brand size="sm" />
          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="hidden text-right text-xs leading-tight sm:block sm:text-sm">
              <p className="text-muted-foreground">Veli</p>
              <p className="font-medium">{profile.full_name}</p>
            </div>
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
        <div className="mx-auto hidden max-w-6xl px-4 pb-2 md:block">
          <DashboardNav role="parent" />
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-5 p-3 pb-24 sm:space-y-6 sm:p-6 sm:pb-6 animate-fade-up">
        {children}
      </main>
      <MobileBottomNav role="parent" />
    </div>
  );
}
