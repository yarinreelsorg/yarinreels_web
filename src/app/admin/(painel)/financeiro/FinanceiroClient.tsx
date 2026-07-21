"use client";

import type { Conteudo, TpCompra, Venda } from "@/types/database";
import { formatarPreco } from "@/lib/catalogo";
import Reveal from "@/components/motion/Reveal";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";

const COR_TIPO: Record<TpCompra, string> = {
  ALUGUEL: "#3987e5",
  VITALICIO: "#008300",
  ASSINATURA: "#d55181",
};

const ROTULO_TIPO: Record<TpCompra, string> = {
  ALUGUEL: "Aluguel",
  VITALICIO: "Vitalício",
  ASSINATURA: "Assinatura",
};

const MESES_ABREV = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

function getValorAproximado(v: Venda, conteudosMap: Map<string, Conteudo>) {
  if (v.tp_compra === "ASSINATURA") return 20;
  if (v.tp_compra === "ALUGUEL") {
    return (v.cd_conteudo ? conteudosMap.get(v.cd_conteudo)?.vl_aluguel : null) ?? 10;
  }
  if (v.tp_compra === "VITALICIO") {
    return (v.cd_conteudo ? conteudosMap.get(v.cd_conteudo)?.vl_vitalicio : null) ?? 30;
  }
  return 0;
}

export default function FinanceiroClient({
  vendas,
  conteudos,
}: {
  vendas: Venda[];
  conteudos: Conteudo[];
}) {
  const conteudosMap = new Map<string, Conteudo>();
  for (const c of conteudos) conteudosMap.set(c.cd_conteudo, c);

  const valor = (v: Venda) => getValorAproximado(v, conteudosMap);

  const aprovadas = vendas.filter((v) => v.tp_status === "APROVADA");
  const pendentes = vendas.filter((v) => v.tp_status === "PENDENTE");

  // KPI: faturamento total e do mês
  const faturamentoTotal = aprovadas.reduce((s, v) => s + valor(v), 0);

  const agora = new Date();
  const faturamentoMes = aprovadas
    .filter((v) => {
      const d = new Date(v.ts_criacao);
      return d.getFullYear() === agora.getFullYear() && d.getMonth() === agora.getMonth();
    })
    .reduce((s, v) => s + valor(v), 0);

  // KPI: taxa de conversão e tempo médio de aprovação
  const totalConsiderado = aprovadas.length + pendentes.length;
  const taxaConversao = totalConsiderado > 0 ? (aprovadas.length / totalConsiderado) * 100 : 0;

  const temposAprovacao = aprovadas
    .map((v) => new Date(v.ts_atualizacao).getTime() - new Date(v.ts_criacao).getTime())
    .filter((ms) => ms > 0);
  const tempoMedioMs =
    temposAprovacao.length > 0
      ? temposAprovacao.reduce((s, ms) => s + ms, 0) / temposAprovacao.length
      : 0;
  const tempoMedioTexto =
    tempoMedioMs === 0
      ? "—"
      : tempoMedioMs < 3_600_000
        ? `${Math.round(tempoMedioMs / 60_000)} min`
        : tempoMedioMs < 86_400_000
          ? `${(tempoMedioMs / 3_600_000).toFixed(1)} h`
          : `${(tempoMedioMs / 86_400_000).toFixed(1)} dias`;

  // Gráfico: faturamento dos últimos 6 meses (aprovada vs pendente)
  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(agora.getFullYear(), agora.getMonth() - (5 - i), 1);
    return { ano: d.getFullYear(), mes: d.getMonth(), label: MESES_ABREV[d.getMonth()] };
  });

  const dadosMensais = meses.map(({ ano, mes, label }) => {
    const doMes = (lista: Venda[]) =>
      lista
        .filter((v) => {
          const d = new Date(v.ts_criacao);
          return d.getFullYear() === ano && d.getMonth() === mes;
        })
        .reduce((s, v) => s + valor(v), 0);

    return { label, aprovada: doMes(aprovadas), pendente: doMes(pendentes) };
  });

  const maxMensal = Math.max(1, ...dadosMensais.map((d) => Math.max(d.aprovada, d.pendente)));

  // Gráfico: faturamento por tipo de compra (aprovadas, all-time)
  const tipos: TpCompra[] = ["ALUGUEL", "VITALICIO", "ASSINATURA"];
  const porTipo = tipos.map((tipo) => ({
    tipo,
    total: aprovadas.filter((v) => v.tp_compra === tipo).reduce((s, v) => s + valor(v), 0),
  }));
  const maxTipo = Math.max(1, ...porTipo.map((t) => t.total));

  // Gráfico: ranking de conteúdos por receita (aluguel + vitalício, aprovadas)
  const receitaPorConteudo = new Map<string, number>();
  for (const v of aprovadas) {
    if (v.tp_compra !== "ALUGUEL" && v.tp_compra !== "VITALICIO") continue;
    if (!v.cd_conteudo) continue;
    receitaPorConteudo.set(v.cd_conteudo, (receitaPorConteudo.get(v.cd_conteudo) ?? 0) + valor(v));
  }
  const rankingReceita = Array.from(receitaPorConteudo.entries())
    .map(([cd_conteudo, total]) => ({
      titulo: conteudosMap.get(cd_conteudo)?.nm_titulo ?? `Conteúdo #${cd_conteudo}`,
      total,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
  const maxRanking = Math.max(1, ...rankingReceita.map((r) => r.total));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Financeiro</h1>
        <p className="text-sm text-[#A78BFA]">Relatórios financeiros e controle de faturamento.</p>
      </div>

      {/* KPIs */}
      <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" staggerChildren={0.08}>
        <StaggerItem className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#A78BFA]">Faturamento Total</span>
            <span className="text-2xl text-[#9D4EDD]">💰</span>
          </div>
          <h3 className="mt-4 text-3xl font-bold text-[#9D4EDD]">{formatarPreco(faturamentoTotal)}</h3>
          <p className="mt-1 text-xs text-[#A78BFA]/70">vendas aprovadas (histórico)</p>
        </StaggerItem>

        <StaggerItem className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#A78BFA]">Faturamento do Mês</span>
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="mt-4 text-3xl font-bold text-white">{formatarPreco(faturamentoMes)}</h3>
          <p className="mt-1 text-xs text-[#A78BFA]/70">vendas aprovadas este mês</p>
        </StaggerItem>

        <StaggerItem className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#A78BFA]">Taxa de Conversão</span>
            <span className="text-2xl">✅</span>
          </div>
          <h3 className="mt-4 text-3xl font-bold text-white">{taxaConversao.toFixed(1)}%</h3>
          <p className="mt-1 text-xs text-[#A78BFA]/70">
            {aprovadas.length} aprovadas / {pendentes.length} pendentes
          </p>
        </StaggerItem>

        <StaggerItem className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#A78BFA]">Tempo Médio p/ Aprovação</span>
            <span className="text-2xl">⏱️</span>
          </div>
          <h3 className="mt-4 text-3xl font-bold text-white">{tempoMedioTexto}</h3>
          <p className="mt-1 text-xs text-[#A78BFA]/70">entre criação e aprovação</p>
        </StaggerItem>
      </StaggerGroup>

      {/* Faturamento mensal: aprovado vs pendente */}
      <Reveal className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Faturamento Mensal</h2>
            <p className="text-xs text-[#A78BFA]">Últimos 6 meses · aprovado vs. pendente</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-[#A78BFA]">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Aprovada
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> Pendente
            </span>
          </div>
        </div>

        <div className="flex h-48 items-end gap-4 sm:gap-6">
          {dadosMensais.map((d) => (
            <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-40 w-full items-end justify-center gap-1">
                <div className="group/bar relative flex h-full w-full max-w-[22px] items-end">
                  <div
                    className="w-full rounded-t-[4px] bg-emerald-400 transition-[height] duration-500"
                    style={{ height: `${(d.aprovada / maxMensal) * 100}%`, minHeight: d.aprovada > 0 ? 2 : 0 }}
                  />
                  <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover/bar:opacity-100">
                    {formatarPreco(d.aprovada)}
                  </div>
                </div>
                <div className="group/bar relative flex h-full w-full max-w-[22px] items-end">
                  <div
                    className="w-full rounded-t-[4px] bg-amber-400 transition-[height] duration-500"
                    style={{ height: `${(d.pendente / maxMensal) * 100}%`, minHeight: d.pendente > 0 ? 2 : 0 }}
                  />
                  <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover/bar:opacity-100">
                    {formatarPreco(d.pendente)}
                  </div>
                </div>
              </div>
              <span className="text-xs font-medium text-[#A78BFA]">{d.label}</span>
            </div>
          ))}
        </div>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Faturamento por tipo de compra */}
        <Reveal className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg">
          <h2 className="mb-1 text-lg font-bold text-white">Por Tipo de Compra</h2>
          <p className="mb-6 text-xs text-[#A78BFA]">Faturamento total aprovado, por categoria</p>

          <div className="space-y-4">
            {porTipo.map((t) => (
              <div key={t.tipo} className="group/row">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-white">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COR_TIPO[t.tipo] }} />
                    {ROTULO_TIPO[t.tipo]}
                  </span>
                  <span className="font-mono text-[#A78BFA]">{formatarPreco(t.total)}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#050208]">
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{ width: `${(t.total / maxTipo) * 100}%`, backgroundColor: COR_TIPO[t.tipo] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Ranking de conteúdos por receita */}
        <Reveal delay={0.1} className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg">
          <h2 className="mb-1 text-lg font-bold text-white">Top Conteúdos por Receita</h2>
          <p className="mb-6 text-xs text-[#A78BFA]">Aluguel + vitalício, vendas aprovadas</p>

          {rankingReceita.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#A78BFA]/70">Nenhuma venda registrada ainda.</p>
          ) : (
            <div className="space-y-3">
              {rankingReceita.map((r, i) => (
                <div key={r.titulo + i}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                    <span className="truncate font-medium text-white">
                      {i + 1}. {r.titulo}
                    </span>
                    <span className="shrink-0 font-mono text-[#A78BFA]">{formatarPreco(r.total)}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#050208]">
                    <div
                      className="h-full rounded-full bg-[#9D4EDD] transition-[width] duration-500"
                      style={{ width: `${(r.total / maxRanking) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Reveal>
      </div>
    </div>
  );
}
