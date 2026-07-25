import { SkeletonBloco, SkeletonCards } from "@/components/admin/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <SkeletonBloco className="h-8 w-40" />
      <SkeletonCards />
      <SkeletonBloco className="h-64 w-full" />
      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonBloco className="h-48 w-full" />
        <SkeletonBloco className="h-48 w-full" />
      </div>
    </div>
  );
}
