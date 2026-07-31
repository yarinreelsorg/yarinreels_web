import { pool } from "@/lib/db";
import { formatarPreco } from "@/lib/catalogo";
import type { Conteudo, Venda, Plano } from "@/types/database";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";
import Reveal from "@/components/motion/Reveal";
import MetricasOnlineCard from "./MetricasOnlineCard";

export const revalidate = 0; // force dynamic rendering

export default async function DashboardPage() {
  const [{ rows: conteudos }, { rows: vendas }, { rows: planos }] = await Promise.all([
    pool.query<Conteudo>('SELECT * FROM "CONTEUDOS"'),
    pool.query<Venda>('SELECT * FROM "VENDAS"'),
    pool.query<Plano>('SELECT * FROM "PLANOS"'),
  ]);

  // Build maps for quick lookup
  const conteudosMap = new Map<string, Conteudo>();
  for (const c of conteudos) {
    conteudosMap.set(c.cd_conteudo, c);
  }

  const planosMap = new Map<string, Plano>();
  for (const p of planos) {
    planosMap.set(p.cd_plano, p);
  }

  // Calculate statistics
  const totalConteudos = conteudos.length;

  const telegramIds = vendas.map((v) => v.nr_id_telegram);
  const totalClientes = new Set(telegramIds).size;

  const agora = new Date();
  const anoAtual = agora.getFullYear();
  const mesAtual = agora.getMonth();

  const getValorAproximado = (v: Venda) => {
    if (v.vl_pago != null) return v.vl_pago;
    if (v.tp_compra === "ASSINATURA") return 20;
    if (v.tp_compra === "ALUGUEL") {
      return (v.cd_conteudo ? conteudosMap.get(v.cd_conteudo)?.vl_aluguel : null) ?? 10;
    }
    if (v.tp_compra === "VITALICIO") {
      return (v.cd_conteudo ? conteudosMap.get(v.cd_conteudo)?.vl_vitalicio : null) ?? 30;
    }
    return 0;
  };

  // Faturamento do mês (contar vendas APROVADAS do mês atual)
  const faturamentoMes = vendas
    .filter((v) => {
      if (v.tp_status !== "APROVADA") return false;
      const dataVenda = new Date(v.ts_criacao);
      return (
        dataVenda.getFullYear() === anoAtual &&
        dataVenda.getMonth() === mesAtual
      );
    })
    .reduce((sum, v) => sum + getValorAproximado(v), 0);

  // Assinantes ativos (ASSINATURA, APROVADA, ts_expiracao > now)
  const agoraIso = agora.toISOString();
  const assinantesAtivos = vendas.filter(
    (v) =>
      v.tp_compra === "ASSINATURA" &&
      v.tp_status === "APROVADA" &&
      !!v.ts_expiracao &&
      v.ts_expiracao > agoraIso
  ).length;

  // 10 últimas vendas
  const ultimasVendas = [...vendas]
    .sort((a, b) => new Date(b.ts_criacao).getTime() - new Date(a.ts_criacao).getTime())
    .slice(0, 10);

  // Faturamento aprovado dos últimos 14 dias
  const DIAS_GRAFICO = 14;
  const diasGrafico = Array.from({ length: DIAS_GRAFICO }, (_, i) => {
    const d = new Date(agora);
    d.setDate(d.getDate() - (DIAS_GRAFICO - 1 - i));
    return d;
  });

  const faturamentoPorDia = diasGrafico.map((dia) => {
    const total = vendas
      .filter((v) => {
        if (v.tp_status !== "APROVADA") return false;
        const d = new Date(v.ts_criacao);
        return (
          d.getFullYear() === dia.getFullYear() &&
          d.getMonth() === dia.getMonth() &&
          d.getDate() === dia.getDate()
        );
      })
      .reduce((s, v) => s + getValorAproximado(v), 0);
    return {
      label: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(dia),
      total,
    };
  });
  const maxFaturamentoDia = Math.max(1, ...faturamentoPorDia.map((d) => d.total));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Dashboard</h1>
        <p className="text-sm text-[#A78BFA]">Visão geral da plataforma YarinReels.</p>
      </div>

      <MetricasOnlineCard />

      {/* 4 Cards de Métrica */}
      <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" staggerChildren={0.08}>
        {/* Card 1: Conteúdos */}
        <StaggerItem className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#A78BFA]">Total de Conteúdos</span>
            <span className="text-2xl">🎬</span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-white">{totalConteudos}</h3>
            <p className="mt-1 text-xs text-[#A78BFA]/70">itens no catálogo</p>
          </div>
        </StaggerItem>

        {/* Card 2: Clientes */}
        <StaggerItem className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#A78BFA]">Clientes Únicos</span>
            <span className="text-2xl">👥</span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-white">{totalClientes}</h3>
            <p className="mt-1 text-xs text-[#A78BFA]/70">usuários do Telegram</p>
          </div>
        </StaggerItem>

        {/* Card 3: Faturamento do Mês */}
        <StaggerItem className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#A78BFA]">Faturamento Mensal</span>
            <span className="text-2xl text-[#9D4EDD]">📊</span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-[#9D4EDD]">
              {formatarPreco(faturamentoMes)}
            </h3>
            <p className="mt-1 text-xs text-[#A78BFA]/70">vendas aprovadas este mês</p>
          </div>
        </StaggerItem>

        {/* Card 4: Assinantes Ativos */}
        <StaggerItem className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#A78BFA]">Assinantes Ativos</span>
            <span className="text-2xl">👑</span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-white">{assinantesAtivos}</h3>
            <p className="mt-1 text-xs text-[#A78BFA]/70">com acesso recorrente</p>
          </div>
        </StaggerItem>
      </StaggerGroup>

      {/* Gráfico: faturamento aprovado dos últimos 14 dias */}
      <Reveal delay={0.1} className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg">
        <h2 className="mb-1 text-lg font-bold text-white">Faturamento Diário</h2>
        <p className="mb-6 text-xs text-[#A78BFA]">Vendas aprovadas nos últimos {DIAS_GRAFICO} dias</p>
        <div className="flex h-40 items-end gap-1.5 sm:gap-2">
          {faturamentoPorDia.map((d) => (
            <div key={d.label} className="group/bar relative flex flex-1 flex-col items-center gap-2">
              <div className="flex h-32 w-full items-end">
                <div
                  className="w-full rounded-t-[3px] bg-[#9D4EDD] transition-[height] duration-500"
                  style={{ height: `${(d.total / maxFaturamentoDia) * 100}%`, minHeight: d.total > 0 ? 2 : 0 }}
                />
              </div>
              <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover/bar:opacity-100">
                {formatarPreco(d.total)}
              </div>
              <span className="text-[10px] text-[#A78BFA]/70">{d.label}</span>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Tabela com as 10 últimas vendas */}
      <Reveal delay={0.2} className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] overflow-hidden shadow-lg">
        <div className="border-b border-[rgba(139,92,246,0.15)] px-6 py-4">
          <h2 className="text-lg font-bold text-white">Últimas Transações</h2>
          <p className="text-xs text-[#A78BFA]">Histórico recente de vendas e assinaturas.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[rgba(139,92,246,0.15)] bg-[#050208]/50 text-xs font-semibold text-[#A78BFA] uppercase tracking-wider">
                <th className="px-6 py-3">ID Telegram</th>
                <th className="px-6 py-3">Tipo</th>
                <th className="px-6 py-3">Conteúdo / Plano</th>
                <th className="px-6 py-3">Valor Estimado</th>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(139,92,246,0.15)] text-sm text-white">
              {vendas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#A78BFA]/70">
                    Nenhuma transação encontrada.
                  </td>
                </tr>
              ) : (
                ultimasVendas.map((venda) => {
                  const valor = getValorAproximado(venda);
                  let itemNome = "-";
                  if (venda.tp_compra === "ASSINATURA") {
                    itemNome =
                      (venda.cd_plano && planosMap.get(venda.cd_plano)?.nm_plano) ??
                      `Plano #${venda.cd_plano}`;
                  } else {
                    itemNome =
                      (venda.cd_conteudo && conteudosMap.get(venda.cd_conteudo)?.nm_titulo) ??
                      `Conteúdo #${venda.cd_conteudo}`;
                  }

                  const dataVenda = new Intl.DateTimeFormat("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(venda.ts_criacao));

                  return (
                    <tr key={venda.cd_venda} className="hover:bg-[rgba(139,92,246,0.05)] transition-colors">
                      <td className="px-6 py-4 font-mono text-xs">{venda.nr_id_telegram}</td>
                      <td className="px-6 py-4">
                        <span className="rounded bg-[#050208] border border-[rgba(139,92,246,0.2)] px-2 py-0.5 text-xs font-medium text-[#A78BFA]">
                          {venda.tp_compra}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium max-w-xs truncate">{itemNome}</td>
                      <td className="px-6 py-4 font-semibold text-[#A78BFA]">
                        {formatarPreco(valor)}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#A78BFA]/80">{dataVenda}</td>
                      <td className="px-6 py-4">
                        {venda.tp_status === "APROVADA" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                            APROVADA
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/20">
                            PENDENTE
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Reveal>
    </div>
  );
}
