"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLinks, useActiveCheck } from "@/components/dashboard-navigation-config";
import type { Role } from "@/lib/types";

const STORAGE_KEY = "sidebar-collapsed";
const CHANGE_EVENT = "sidebar-collapsed-changed";

// Mobil pin barındaki desenle aynı: localStorage + useSyncExternalStore
// (SSR anlık görüntüsü "açık"tır; tercih istemcide devreye girer).
function subscribeCollapsed(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function readCollapsed() {
  return localStorage.getItem(STORAGE_KEY) === "1";
}

/**
 * Masaüstü/tablet yan menüsü: üstteki sayfalar dikey, açılıp kapanabilen bir
 * panelde. Daraltılmış durumda yalnız ikonlar görünür; tercih localStorage'da
 * saklanır. Mobil (sm altı) alt bar değişmedi — bu bileşen orada çizilmez.
 */
export function DashboardSidebar({
  role,
  showExams,
}: {
  role: Role;
  showExams: boolean;
}) {
  const links = getLinks(role, showExams);
  const isActive = useActiveCheck(role);
  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);

  function toggle() {
    localStorage.setItem(STORAGE_KEY, collapsed ? "0" : "1");
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return (
    <aside
      className={cn(
        "hidden shrink-0 transition-[width] duration-200 sm:block",
        collapsed ? "w-16" : "w-56",
      )}
    >
      <nav className="sticky top-24 flex flex-col gap-1" aria-label="Ana menü">
        {links.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              title={collapsed ? link.label : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                collapsed && "justify-center px-0",
                active
                  ? "gradient-surface text-white shadow-md shadow-primary/25"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{link.label}</span>}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={toggle}
          className={cn(
            "mt-2 flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
            collapsed && "justify-center px-0",
          )}
          aria-label={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
          title={collapsed ? "Menüyü genişlet" : undefined}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4 shrink-0" />
              <span>Daralt</span>
            </>
          )}
        </button>
      </nav>
    </aside>
  );
}
