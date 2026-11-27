import { SkeletonBloco } from "@/components/admin/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <SkeletonBloco className="h-10 w-64" />
      <SkeletonBloco className="h-20 w-full max-w-xl" />
      <SkeletonBloco className="h-72 w-full max-w-xl" />
    </div>
  );
}
