"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import type { DashboardData, StoredLayout } from "@/lib/dashboard-types";

const DashboardEditor = dynamic(
  () =>
    import("@/components/dashboard/customizable-dashboard").then(
      (module) => module.CustomizableDashboard,
    ),
  {
    loading: () => (
      <div className="min-h-64 animate-pulse rounded-2xl border bg-muted/30" />
    ),
  },
);

export function DashboardHomeClient({
  data,
  initialLayout,
  children,
}: {
  data: DashboardData;
  initialLayout: StoredLayout | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <DashboardEditor
        data={data}
        initialLayout={initialLayout}
        startEditing
        onFinish={() => {
          setEditing(false);
          router.refresh();
        }}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Anasayfa"
        description={`Merhaba ${data.firstName} 👋 Öncelikli bilgilerin burada.`}
        action={
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex min-h-11 items-center gap-1.5 rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            <SlidersHorizontal className="h-4 w-4" /> Düzenle
          </button>
        }
      />
      {children}
    </>
  );
}
