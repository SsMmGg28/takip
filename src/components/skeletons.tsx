import { Skeleton } from "@/components/ui/skeleton";

/** Rota loading.tsx dosyalarının paylaştığı iskelet yapı taşları. */

export function PageHeaderSkeleton({ withAction = false }: { withAction?: boolean }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 pb-1">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      {withAction && <Skeleton className="h-9 w-36 rounded-md" />}
    </div>
  );
}

export function CardListSkeleton({
  count = 3,
  height = "h-32",
}: {
  count?: number;
  height?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={`${height} rounded-2xl`} />
      ))}
    </div>
  );
}

export function CardGridSkeleton({
  count = 6,
  cols = "sm:grid-cols-2 lg:grid-cols-3",
  height = "h-36",
}: {
  count?: number;
  cols?: string;
  height?: string;
}) {
  return (
    <div className={`grid gap-3 ${cols}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={`${height} rounded-2xl`} />
      ))}
    </div>
  );
}

export function StatRowSkeleton({
  count = 3,
  cols = "sm:grid-cols-3",
}: {
  count?: number;
  cols?: string;
}) {
  return (
    <div className={`grid gap-3 ${cols}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-2xl" />
      ))}
    </div>
  );
}

export function WeekGridSkeleton() {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton key={i} className="h-36 rounded-lg" />
      ))}
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-9 w-20 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="ml-2 h-5 w-40" />
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-md" />
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border">
      <Skeleton className="h-10 w-full rounded-none" />
      <div className="flex flex-col divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-none opacity-70" />
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );
}
