import { SkeletonBloco, SkeletonTabela } from "@/components/admin/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <SkeletonBloco className="h-8 w-56" />
      <SkeletonBloco className="h-32 w-full" />
      <SkeletonTabela linhas={4} />
    </div>
  );
}
