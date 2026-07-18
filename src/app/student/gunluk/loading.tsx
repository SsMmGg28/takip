import { PageHeaderSkeleton, StatRowSkeleton, CardListSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <StatRowSkeleton />
      <CardListSkeleton />
    </div>
  );
}
