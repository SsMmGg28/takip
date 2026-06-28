import { requireRole } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["parent"]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <Brand size="sm" />
          <div className="flex flex-1 items-center justify-between gap-3 sm:justify-end">
            <div className="text-right text-xs leading-tight sm:text-sm">
              <p className="text-muted-foreground">Veli</p>
              <p className="font-medium">{profile.full_name}</p>
            </div>
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
        <div className="mx-auto max-w-6xl overflow-x-auto px-4 pb-2">
          <DashboardNav role="parent" />
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 animate-fade-up">{children}</main>
    </div>
  );
}
