import {
  CardListSkeleton,
  ChartSkeleton,
  PageHeaderSkeleton,
} from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <ChartSkeleton />
      <CardListSkeleton count={2} height="h-28" />
    </div>
  );
}
