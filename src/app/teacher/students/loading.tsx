import { PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton withAction />
      <TableSkeleton rows={6} />
      <TableSkeleton rows={3} />
    </div>
  );
}
