"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { registrarVisita, salvarOrigemVisitante } from "@/lib/visitas";

const INTERVALO_HEARTBEAT_MS = 60_000;

export default function VisitaTracker() {
  return (
    <Suspense fallback={null}>
      <VisitaTrackerInner />
    </Suspense>
  );
}

function VisitaTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rastreavel = !pathname.startsWith("/admin");

  useEffect(() => {
    if (!rastreavel) return;

    const paramOrigem =
      searchParams.get("origem") ||
      searchParams.get("ref") ||
      searchParams.get("start") ||
      searchParams.get("tgWebAppStartParam") ||
      searchParams.get("start_param");

    if (paramOrigem) {
      salvarOrigemVisitante(paramOrigem);
    } else if (
      typeof window !== "undefined" &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).Telegram?.WebApp?.initDataUnsafe?.start_param
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tgParam = (window as any).Telegram.WebApp.initDataUnsafe.start_param;
      if (tgParam) salvarOrigemVisitante(String(tgParam));
    }

    registrarVisita(pathname);
    const id = setInterval(() => registrarVisita(pathname), INTERVALO_HEARTBEAT_MS);
    return () => clearInterval(id);
  }, [pathname, searchParams, rastreavel]);

  return null;
}
