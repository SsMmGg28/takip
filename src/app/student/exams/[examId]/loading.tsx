import {
  ChartSkeleton,
  PageHeaderSkeleton,
  StatRowSkeleton,
} from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton withAction />
      <StatRowSkeleton />
      <ChartSkeleton />
    </div>
  );
}
