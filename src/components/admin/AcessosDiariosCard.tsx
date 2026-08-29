"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { obterMetricasAcessoDiario, type MetricasAcessoDiario } from "@/lib/visitas";

const ALTURA_GRAFICO_PX = 96;

function formatarDataCurta(data: string) {
  const [, mes, dia] = data.split("-");
  return `${dia}/${mes}`;
}

export default function AcessosDiariosCard() {
  const [metricas, setMetricas] = useState<MetricasAcessoDiario | null>(null);

  useEffect(() => {
    obterMetricasAcessoDiario().then(setMetricas);
  }, []);

  const serie = metricas?.serie ?? [];
  const maiorValor = Math.max(1, ...serie.map((d) => d.total));
  const hoje = metricas?.hoje ?? 0;
  const ontem = metricas?.ontem ?? 0;
  const diferenca = hoje - ontem;
  const percentual = ontem > 0 ? Math.round((diferenca / ontem) * 100) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-medium text-[#A78BFA]">Acessos ao Site</h2>
          <p className="mt-1 text-xs text-[#A78BFA]/60">
            Visitantes únicos por dia — tráfego orgânico, sem anúncios.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div>
            <div className="text-2xl font-bold text-white">{metricas ? hoje : "—"}</div>
            <p className="text-xs text-[#A78BFA]/70">hoje</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#A78BFA]">{metricas ? ontem : "—"}</div>
            <p className="text-xs text-[#A78BFA]/70">ontem</p>
          </div>
          {metricas && (
            <div
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                diferenca > 0
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : diferenca < 0
                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                    : "bg-white/5 text-[#A78BFA] border border-white/10"
              }`}
            >
              {diferenca > 0 ? "▲" : diferenca < 0 ? "▼" : "＝"} {Math.abs(diferenca)}
              {percentual !== null && ` (${percentual > 0 ? "+" : ""}${percentual}%)`}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex gap-1.5">
        {serie.length === 0
          ? Array.from({ length: 14 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-1 flex-col justify-end"
                style={{ height: ALTURA_GRAFICO_PX }}
              >
                <div className="animate-pulse rounded-t bg-white/5" style={{ height: "30%" }} />
              </div>
            ))
          : serie.map((dia) => {
              const alturaPercentual = Math.max(4, (dia.total / maiorValor) * 100);
              return (
                <div
                  key={dia.data}
                  className="group relative flex flex-1 flex-col justify-end"
                  style={{ height: ALTURA_GRAFICO_PX }}
                >
                  <div className="absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded border border-[rgba(139,92,246,0.3)] bg-[#050208] px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                    {formatarDataCurta(dia.data)}: {dia.total}
                  </div>
                  <div
                    className="rounded-t bg-[#8B5CF6] transition-colors group-hover:bg-[#A78BFA]"
                    style={{ height: `${alturaPercentual}%` }}
                  />
                </div>
              );
            })}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-[#A78BFA]/60">
        <span>{serie[0] ? formatarDataCurta(serie[0].data) : ""}</span>
        <span>{serie[serie.length - 1] ? formatarDataCurta(serie[serie.length - 1].data) : ""}</span>
      </div>
    </motion.div>
  );
}
