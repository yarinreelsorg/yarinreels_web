import { SkeletonBloco, SkeletonTabela } from "@/components/admin/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <SkeletonBloco className="h-8 w-52" />
      <SkeletonBloco className="h-28 w-full max-w-xs" />
      <SkeletonTabela linhas={8} />
    </div>
  );
}
