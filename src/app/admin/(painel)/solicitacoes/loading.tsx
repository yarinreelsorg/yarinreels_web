import { SkeletonBloco, SkeletonTabela } from "@/components/admin/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <SkeletonBloco className="h-8 w-52" />
      <SkeletonTabela linhas={8} />
    </div>
  );
}
