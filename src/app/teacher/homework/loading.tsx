import {
  CardListSkeleton,
  PageHeaderSkeleton,
  StatRowSkeleton,
} from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton withAction />
      <StatRowSkeleton count={4} cols="sm:grid-cols-2 lg:grid-cols-4" />
      <CardListSkeleton count={3} />
    </div>
  );
}
