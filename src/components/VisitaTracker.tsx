"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { registrarVisita } from "@/lib/visitas";

const INTERVALO_HEARTBEAT_MS = 60_000;

/**
 * Componente invisível que registra visitas/presença pro painel admin
 * (usuários online agora, total de visitas, dispositivo). Fica de fora
 * das rotas /admin de propósito — não queremos contar o próprio admin
 * navegando no painel como "visita" do site.
 */
export default function VisitaTracker() {
  const pathname = usePathname();
  const rastreavel = !pathname.startsWith("/admin");

  useEffect(() => {
    if (!rastreavel) return;

    registrarVisita(pathname);
    const id = setInterval(() => registrarVisita(pathname), INTERVALO_HEARTBEAT_MS);
    return () => clearInterval(id);
  }, [pathname, rastreavel]);

  return null;
}
