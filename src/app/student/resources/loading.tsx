import { CardGridSkeleton, PageHeaderSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton withAction />
      <CardGridSkeleton count={6} />
    </div>
  );
}
