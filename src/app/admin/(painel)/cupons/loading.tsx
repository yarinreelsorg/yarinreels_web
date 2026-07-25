import { SkeletonBloco, SkeletonTabela } from "@/components/admin/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SkeletonBloco className="h-8 w-40" />
        <SkeletonBloco className="h-10 w-36" />
      </div>
      <SkeletonBloco className="h-10 w-full max-w-md" />
      <SkeletonTabela linhas={5} />
    </div>
  );
}
