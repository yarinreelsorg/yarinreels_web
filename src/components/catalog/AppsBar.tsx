"use client";

import Link from "next/link";

const ICONES_APP: Record<string, string> = {
  reelshort: "🎬",
  dramabox: "📺",
  shortmax: "🎞️",
  moboreels: "📱",
};

function icone(app: string) {
  return ICONES_APP[app.toLowerCase()] ?? "▶️";
}

export default function AppsBar({ apps }: { apps: string[] }) {
  if (apps.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto px-4 pb-3 pt-1 [scrollbar-width:none] sm:px-8 [&::-webkit-scrollbar]:hidden">
      {apps.map((app) => (
        <Link
          key={app}
          href={`/catalogo?app=${encodeURIComponent(app)}`}
          className="flex shrink-0 flex-col items-center gap-1 text-[11px] font-semibold text-secondary transition-colors hover:text-foreground"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-xl">
            {icone(app)}
          </span>
          {app}
        </Link>
      ))}
    </div>
  );
}
