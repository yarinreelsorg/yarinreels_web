"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { registrarVisita, salvarOrigemVisitante } from "@/lib/visitas";

const INTERVALO_HEARTBEAT_MS = 30_000;

export default function VisitaTracker() {
  return (
    <Suspense fallback={null}>
      <VisitaTrackerInner />
    </Suspense>
  );
}

function obterNomeDispositivo(): string {
  if (typeof window === "undefined") return "Desconhecido";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tgPlatform = (window as any).Telegram?.WebApp?.platform;
  if (tgPlatform === "ios") return "🍎 iPhone";
  if (tgPlatform === "android") return "🤖 Android";
  if (tgPlatform === "tdesktop") return "💻 PC Windows";
  if (tgPlatform === "web") return "🌐 Navegador Web";

  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "🍎 iPhone";
  if (/android/.test(ua)) return "🤖 Android";
  if (/windows/.test(ua)) return "💻 PC Windows";
  if (/macintosh|mac os x/.test(ua)) return "🍏 Mac";

  return "🌐 Navegador Web";
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

    // Registrar visita estática (dashboard admin tradicional)
    registrarVisita(pathname);

    // Heartbeat de presença em tempo real (Radar SESSOES)
    const dispositivo = obterNomeDispositivo();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tgUserId = (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id;

    const dispararHeartbeat = () => {
      fetch("/api/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nr_id_telegram: tgUserId || undefined,
          dispositivo,
        }),
      }).catch(() => {});
    };

    dispararHeartbeat();
    const id = setInterval(dispararHeartbeat, INTERVALO_HEARTBEAT_MS);
    return () => clearInterval(id);
  }, [pathname, searchParams, rastreavel]);

  return null;
}
