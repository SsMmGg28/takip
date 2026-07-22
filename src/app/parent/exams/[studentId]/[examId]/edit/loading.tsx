import { CardListSkeleton, PageHeaderSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <CardListSkeleton count={3} height="h-40" />
    </div>
  );
}
