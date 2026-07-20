import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardHomeClient } from "@/components/dashboard/dashboard-home-client";
import {
  resolveLayout,
  widgetTitle,
  WIDGET_BY_ID,
} from "@/components/dashboard/registry";
import type { DashboardData, StoredLayout } from "@/lib/dashboard-types";

const COL_CLASS: Record<number, string> = {
  1: "col-span-1",
  2: "col-span-1 lg:col-span-2",
  3: "col-span-1 lg:col-span-3",
  4: "col-span-1 lg:col-span-4",
};
const ROW_CLASS: Record<number, string> = {
  1: "lg:row-span-1",
  2: "lg:row-span-2",
  3: "lg:row-span-3",
};

export function DashboardHome({
  data,
  initialLayout,
}: {
  data: DashboardData;
  initialLayout: StoredLayout | null;
}) {
  const { items } = resolveLayout(initialLayout, data.role);

  return (
    <DashboardHomeClient data={data} initialLayout={initialLayout}>
      <div className="animate-fade-up grid grid-cols-1 gap-3 lg:auto-rows-[8.5rem] lg:grid-cols-4 lg:gap-4">
        {items.map((item) => {
          const def = WIDGET_BY_ID.get(item.id);
          if (!def) return null;
          const Icon = def.icon;
          const Component = def.component;
          const href = def.href?.(data.role);

          return (
            <section
              key={item.id}
              className={cn(
                "flex min-h-36 flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm lg:min-h-0",
                COL_CLASS[item.w],
                ROW_CLASS[item.h],
              )}
            >
              <div className="flex min-h-11 items-center gap-1.5 px-3 pb-1 pt-2.5">
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                {href ? (
                  <Link
                    href={href}
                    className="group/title flex min-w-0 flex-1 items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-primary"
                  >
                    <span className="truncate">{widgetTitle(def, data.role)}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover/title:opacity-100" />
                  </Link>
                ) : (
                  <h2 className="min-w-0 flex-1 truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {widgetTitle(def, data.role)}
                  </h2>
                )}
              </div>
              <div className="min-h-0 flex-1 px-3 pb-3">
                <Component data={data} w={item.w} h={item.h} />
              </div>
            </section>
          );
        })}
      </div>
    </DashboardHomeClient>
  );
}
