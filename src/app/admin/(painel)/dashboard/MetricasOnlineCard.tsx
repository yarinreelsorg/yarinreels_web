"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { obterMetricasOnline, type MetricasOnline } from "@/lib/visitas";

const INTERVALO_POLLING_MS = 15_000;

export default function MetricasOnlineCard() {
  const [metricas, setMetricas] = useState<MetricasOnline | null>(null);

  useEffect(() => {
    let ativo = true;
    const carregar = () => {
      obterMetricasOnline().then((m) => {
        if (ativo) setMetricas(m);
      });
    };
    carregar();
    const id = setInterval(carregar, INTERVALO_POLLING_MS);
    return () => {
      ativo = false;
      clearInterval(id);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#A78BFA]">Online Agora</span>
        <span className="flex h-2 w-2 items-center justify-center">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <h3 className="text-3xl font-bold text-emerald-400">{metricas?.onlineAgora ?? "—"}</h3>
          <p className="mt-1 text-xs text-[#A78BFA]/70">visitantes ativos (5 min)</p>
        </div>
        <div className="text-right">
          <h4 className="text-xl font-bold text-white">{metricas?.visitasHoje ?? "—"}</h4>
          <p className="text-xs text-[#A78BFA]/70">visitas hoje</p>
        </div>
      </div>
      {metricas && metricas.dispositivosHoje.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[rgba(139,92,246,0.1)] pt-3">
          {metricas.dispositivosHoje.map((d) => (
            <span
              key={d.dispositivo}
              className="rounded bg-[#050208] border border-[rgba(139,92,246,0.2)] px-2 py-0.5 text-[10px] text-[#A78BFA]"
            >
              {d.dispositivo}: {d.total}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
