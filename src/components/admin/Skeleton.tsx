export function SkeletonBloco({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[#0D0A1A] ${className}`} />;
}

export function SkeletonCards({ quantidade = 4 }: { quantidade?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: quantidade }, (_, i) => (
        <SkeletonBloco key={i} className="h-28 border border-[rgba(139,92,246,0.1)]" />
      ))}
    </div>
  );
}

export function SkeletonTabela({ linhas = 8 }: { linhas?: number }) {
  return (
    <div className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] overflow-hidden shadow-lg">
      <div className="border-b border-[rgba(139,92,246,0.15)] bg-[#050208]/50 h-11" />
      <div className="divide-y divide-[rgba(139,92,246,0.1)]">
        {Array.from({ length: linhas }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4">
            <div className="h-4 w-full animate-pulse rounded bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonBloco className="h-8 w-48" />
        <SkeletonBloco className="h-4 w-72" />
      </div>
      <SkeletonCards />
      <SkeletonTabela />
    </div>
  );
}
