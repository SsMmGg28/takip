import { CardGridSkeleton, PageHeaderSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <CardGridSkeleton count={6} height="h-28" />
    </div>
  );
}
