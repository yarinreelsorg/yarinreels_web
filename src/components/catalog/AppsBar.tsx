"use client";

import Link from "next/link";
import type { AppNavegacao } from "@/lib/apps-config";

export default function AppsBar({ apps }: { apps: AppNavegacao[] }) {
  if (apps.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto px-4 pb-3 pt-1 [scrollbar-width:none] sm:px-8 [&::-webkit-scrollbar]:hidden">
      {apps.map((app) => (
        <Link
          key={app.cd_app}
          href={`/app/${encodeURIComponent(app.nm_app)}`}
          className="flex shrink-0 flex-col items-center gap-1 text-[11px] font-semibold text-secondary transition-colors hover:text-foreground"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-xl">
            {app.ds_icone.startsWith("http") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={app.ds_icone} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              app.ds_icone
            )}
          </span>
          {app.nm_app}
        </Link>
      ))}
    </div>
  );
}
