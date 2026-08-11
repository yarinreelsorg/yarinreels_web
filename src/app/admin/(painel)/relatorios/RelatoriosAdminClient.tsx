"use client";

import { useState, useTransition } from "react";
import { formatarPreco } from "@/lib/catalogo";
import { formatarDataHora } from "@/lib/data";
import { baixarCsv } from "@/lib/csv";
import { useToast } from "@/components/admin/ToastProvider";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";
import Reveal from "@/components/motion/Reveal";
import Pagination from "@/components/admin/Pagination";
import {
  carregarDadosRelatorios,
  exportarRelatorioCsv,
  type FiltrosRelatorio,
  type MetricasRelatorio,
  type OrigemTelegramItem,
  type RankingItem,
  type TipoPeriodoRelatorio,
  type VendaRelatorioItem,
} from "./actions";

const RANGO_ROTULOS: Record<TipoPeriodoRelatorio, string> = {
  hoje: "Hoje (Meia-noite até agora)",
  ontem: "Ontem",
  "7dias": "Últimos 7 Dias",
  este_mes: "Este Mês",
  "30dias": "Últimos 30 Dias",
  personalizado: "Período Personalizado",
};

export default function RelatoriosAdminClient({
  dadosIniciais,
  listaOrigensIniciais,
}: {
  dadosIniciais: {
    metricas: MetricasRelatorio;
    rankingConteudos: RankingItem[];
    origensTelegram: OrigemTelegramItem[];
    vendasTabela: VendaRelatorioItem[];
  };
  listaOrigensIniciais: string[];
}) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const [periodo, setPeriodo] = useState<TipoPeriodoRelatorio>("hoje");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [statusFilter, setStatusFilter] = useState<"TODAS" | "APROVADA" | "PENDENTE">("TODAS");
  const [origemFilter, setOrigemFilter] = useState<string>("TODAS");
  const [buscaTabela, setBuscaTabela] = useState("");
  const [paginaTabela, setPaginaTabela] = useState(1);
  const [abaAtiva, setAbaAtiva] = useState<"ranking" | "origens" | "transacoes">("ranking");

  const [dados, setDados] = useState(dadosIniciais);
  const [exportando, setExportando] = useState(false);

  const ITENS_POR_PAGINA = 15;

  const aplicarFiltros = (novosFiltros: Partial<FiltrosRelatorio>) => {
    const proximo: FiltrosRelatorio = {
      periodo: novosFiltros.periodo ?? periodo,
      dataInicio: novosFiltros.dataInicio ?? dataInicio,
      dataFim: novosFiltros.dataFim ?? dataFim,
      status: novosFiltros.status ?? statusFilter,
      origemFilter: novosFiltros.origemFilter ?? origemFilter,
    };

    startTransition(async () => {
      try {
        const novosDados = await carregarDadosRelatorios(proximo);
        setDados({
          metricas: novosDados.metricas,
          rankingConteudos: novosDados.rankingConteudos,
          origensTelegram: novosDados.origensTelegram,
          vendasTabela: novosDados.vendasTabela,
        });
        setPaginaTabela(1);
      } catch {
        toast.erro("Erro ao carregar relatórios.");
      }
    });
  };

  const aoMudarPeriodo = (p: TipoPeriodoRelatorio) => {
    setPeriodo(p);
    if (p !== "personalizado") {
      aplicarFiltros({ periodo: p });
    }
  };

  const aoExportar = async () => {
    setExportando(true);
    try {
      const csv = await exportarRelatorioCsv({
        periodo,
        dataInicio,
        dataFim,
        status: statusFilter,
        origemFilter,
      });
      baixarCsv(csv, `relatorio_vendas_${periodo}.csv`);
    } catch {
      toast.erro("Erro ao exportar relatório CSV.");
    } finally {
      setExportando(false);
    }
  };

  // Filtragem local na tabela de transações
  const vendasFiltradasBusca = dados.vendasTabela.filter((v) => {
    if (!buscaTabela) return true;
    const termo = buscaTabela.toLowerCase();
    return (
      String(v.nr_id_telegram).includes(termo) ||
      v.nm_item.toLowerCase().includes(termo) ||
      v.ds_origem.toLowerCase().includes(termo)
    );
  });

  const totalPaginas = Math.max(1, Math.ceil(vendasFiltradasBusca.length / ITENS_POR_PAGINA));
  const vendasPagina = vendasFiltradasBusca.slice(
    (paginaTabela - 1) * ITENS_POR_PAGINA,
    paginaTabela * ITENS_POR_PAGINA
  );

  const maxVendasRanking = Math.max(1, ...(dados.rankingConteudos.map((r) => r.total_vendas) ?? [1]));

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Relatórios & Origem de Vendas</h1>
          <p className="text-sm text-[#A78BFA]">
            Análise detalhada de faturamento, ranking de séries e origens do Telegram.
          </p>
        </div>
        <button
          type="button"
          onClick={aoExportar}
          disabled={exportando || isPending}
          className="rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] px-5 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          {exportando ? "Gerando CSV..." : "⇩ Exportar Relatório CSV"}
        </button>
      </div>

      {/* Bar de Filtros */}
      <div className="rounded-lg border border-[rgba(139,92,246,0.2)] bg-[#0D0A1A] p-6 shadow-lg space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {(["hoje", "ontem", "7dias", "este_mes", "30dias", "personalizado"] as TipoPeriodoRelatorio[]).map(
            (p) => (
              <button
                key={p}
                type="button"
                onClick={() => aoMudarPeriodo(p)}
                className={`rounded-md px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
                  periodo === p
                    ? "bg-[#9D4EDD] text-white"
                    : "bg-[#050208] text-[#A78BFA] border border-[rgba(139,92,246,0.2)] hover:bg-white/5"
                }`}
              >
                {RANGO_ROTULOS[p]}
              </button>
            )
          )}
        </div>

        {/* Form Período Personalizado & Filtros Secundários */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2 border-t border-[rgba(139,92,246,0.15)]">
          {periodo === "personalizado" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">Data Início</label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] rounded-[6px] p-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">Data Fim</label>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] rounded-[6px] p-2 text-xs text-white"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">Status da Venda</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                const val = e.target.value as "TODAS" | "APROVADA" | "PENDENTE";
                setStatusFilter(val);
                aplicarFiltros({ status: val });
              }}
              className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] rounded-[6px] p-2 text-xs text-white"
            >
              <option value="TODAS">Todas (Aprovadas + Pendentes)</option>
              <option value="APROVADA">Apenas Aprovadas</option>
              <option value="PENDENTE">Apenas Pendentes</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">Origem / Canal Telegram</label>
            <select
              value={origemFilter}
              onChange={(e) => {
                const val = e.target.value;
                setOrigemFilter(val);
                aplicarFiltros({ origemFilter: val });
              }}
              className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] rounded-[6px] p-2 text-xs text-white"
            >
              <option value="TODAS">Todas as Origens</option>
              {listaOrigensIniciais.map((orig) => (
                <option key={orig} value={orig}>
                  {orig}
                </option>
              ))}
            </select>
          </div>

          {periodo === "personalizado" && (
            <div className="flex items-end lg:col-span-4">
              <button
                type="button"
                onClick={() => aplicarFiltros({})}
                className="rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] px-4 py-2 text-xs font-bold text-white cursor-pointer"
              >
                Aplicar Período Personalizado
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cards de Métricas do Período */}
      <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" staggerChildren={0.06}>
        <StaggerItem className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg">
          <span className="text-sm font-medium text-[#A78BFA]">Faturamento no Período</span>
          <h3 className="mt-3 text-3xl font-bold text-[#9D4EDD]">
            {formatarPreco(dados.metricas.faturamentoTotal)}
          </h3>
          <p className="mt-1 text-xs text-[#A78BFA]/70">vendas aprovadas</p>
        </StaggerItem>

        <StaggerItem className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg">
          <span className="text-sm font-medium text-[#A78BFA]">Vendas Realizadas</span>
          <h3 className="mt-3 text-3xl font-bold text-white">{dados.metricas.totalVendas}</h3>
          <p className="mt-1 text-xs text-[#A78BFA]/70">
            {dados.metricas.vendasAprovadas} aprovadas · {dados.metricas.vendasPendentes} pendentes
          </p>
        </StaggerItem>

        <StaggerItem className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg">
          <span className="text-sm font-medium text-[#A78BFA]">Ticket Médio</span>
          <h3 className="mt-3 text-3xl font-bold text-emerald-400">
            {formatarPreco(dados.metricas.ticketMedio)}
          </h3>
          <p className="mt-1 text-xs text-[#A78BFA]/70">por venda aprovada</p>
        </StaggerItem>

        <StaggerItem className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg">
          <span className="text-sm font-medium text-[#A78BFA]">Origens Telegram Rastreadas</span>
          <h3 className="mt-3 text-3xl font-bold text-white">{dados.origensTelegram.length}</h3>
          <p className="mt-1 text-xs text-[#A78BFA]/70">canais/grupos identificados</p>
        </StaggerItem>
      </StaggerGroup>

      {/* Abas de Visualização */}
      <div className="flex border-b border-[rgba(139,92,246,0.15)] gap-6">
        <button
          type="button"
          onClick={() => setAbaAtiva("ranking")}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            abaAtiva === "ranking"
              ? "border-[#9D4EDD] text-white"
              : "border-transparent text-[#A78BFA] hover:text-white"
          }`}
        >
          🏆 Ranking de Séries Mais Vendidas
        </button>
        <button
          type="button"
          onClick={() => setAbaAtiva("origens")}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            abaAtiva === "origens"
              ? "border-[#9D4EDD] text-white"
              : "border-transparent text-[#A78BFA] hover:text-white"
          }`}
        >
          ✈️ Rastreamento de Origem Telegram
        </button>
        <button
          type="button"
          onClick={() => setAbaAtiva("transacoes")}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            abaAtiva === "transacoes"
              ? "border-[#9D4EDD] text-white"
              : "border-transparent text-[#A78BFA] hover:text-white"
          }`}
        >
          📋 Todas as Transações ({vendasFiltradasBusca.length})
        </button>
      </div>

      {/* Conteúdo da Aba 1: Ranking */}
      {abaAtiva === "ranking" && (
        <Reveal className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg space-y-4">
          <h2 className="text-lg font-bold text-white">Ranking de Conteúdos no Período</h2>
          {dados.rankingConteudos.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#A78BFA]/70">
              Nenhuma venda de conteúdo registrada neste período.
            </p>
          ) : (
            <div className="space-y-3">
              {dados.rankingConteudos.map((item, index) => {
                const porc = (item.total_vendas / maxVendasRanking) * 100;
                return (
                  <div
                    key={item.cd_conteudo}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-[rgba(139,92,246,0.1)] bg-[#050208]/60 p-4 hover:border-[rgba(139,92,246,0.2)] transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7B2FBE]/20 font-mono text-sm font-bold text-[#A78BFA]">
                        #{index + 1}
                      </span>
                      {item.ds_url_poster ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.ds_url_poster}
                          alt=""
                          className="h-14 w-10 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="h-14 w-10 shrink-0 rounded bg-surface" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-white truncate">{item.nm_titulo}</p>
                        <p className="text-xs text-[#A78BFA]">{item.nm_categoria}</p>
                        <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-[#9D4EDD]"
                            style={{ width: `${porc}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 text-right">
                      <div>
                        <p className="text-xs text-[#A78BFA]">Total Vendas</p>
                        <p className="text-lg font-bold text-white">{item.total_vendas}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#A78BFA]">Faturamento</p>
                        <p className="text-lg font-bold text-[#9D4EDD]">
                          {formatarPreco(item.faturamento_total)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Reveal>
      )}

      {/* Conteúdo da Aba 2: Origem Telegram */}
      {abaAtiva === "origens" && (
        <Reveal className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg space-y-4">
          <h2 className="text-lg font-bold text-white">Desempenho por Canal / Grupo Telegram</h2>
          {dados.origensTelegram.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#A78BFA]/70">
              Nenhum dado de origem registrado no período.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[rgba(139,92,246,0.15)] bg-[#050208]/50 text-xs font-semibold text-[#A78BFA] uppercase">
                    <th className="px-6 py-3">Canal / Origem Telegram</th>
                    <th className="px-6 py-3">Vendas Total</th>
                    <th className="px-6 py-3">Faturamento</th>
                    <th className="px-6 py-3">Ticket Médio</th>
                    <th className="px-6 py-3">% Faturamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(139,92,246,0.15)] text-sm text-white">
                  {dados.origensTelegram.map((orig) => (
                    <tr key={orig.ds_origem} className="hover:bg-[rgba(139,92,246,0.05)]">
                      <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                        <span>✈️</span> {orig.ds_origem}
                      </td>
                      <td className="px-6 py-4 font-semibold">{orig.total_vendas}</td>
                      <td className="px-6 py-4 font-bold text-[#9D4EDD]">
                        {formatarPreco(orig.faturamento_total)}
                      </td>
                      <td className="px-6 py-4 font-mono text-emerald-400">
                        {formatarPreco(orig.ticket_medio)}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-[#A78BFA]">
                        {orig.porcentagem.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Reveal>
      )}

      {/* Conteúdo da Aba 3: Todas as Transações */}
      {abaAtiva === "transacoes" && (
        <Reveal className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] overflow-hidden shadow-lg space-y-4">
          <div className="p-6 pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-bold text-white">Histórico Completo de Vendas</h2>
            <div className="w-full sm:w-72">
              <input
                type="text"
                placeholder="Buscar por ID Telegram, item, origem..."
                value={buscaTabela}
                onChange={(e) => {
                  setBuscaTabela(e.target.value);
                  setPaginaTabela(1);
                }}
                className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] py-1.5 px-3 text-white text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[rgba(139,92,246,0.15)] bg-[#050208]/50 text-xs font-semibold text-[#A78BFA] uppercase">
                  <th className="px-6 py-3">ID Telegram</th>
                  <th className="px-6 py-3">Tipo</th>
                  <th className="px-6 py-3">Item / Conteúdo</th>
                  <th className="px-6 py-3">Valor</th>
                  <th className="px-6 py-3">Método</th>
                  <th className="px-6 py-3">Origem Telegram</th>
                  <th className="px-6 py-3">Data/Hora</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(139,92,246,0.15)] text-sm text-white">
                {vendasPagina.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-[#A78BFA]/70">
                      Nenhuma transação encontrada.
                    </td>
                  </tr>
                ) : (
                  vendasPagina.map((v) => (
                    <tr key={v.cd_venda} className="hover:bg-[rgba(139,92,246,0.05)]">
                      <td className="px-6 py-4 font-mono text-xs">{v.nr_id_telegram}</td>
                      <td className="px-6 py-4">
                        <span className="bg-[#050208] border border-[rgba(139,92,246,0.2)] px-2 py-0.5 rounded text-xs font-medium text-[#A78BFA]">
                          {v.tp_compra}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold max-w-xs truncate">{v.nm_item}</td>
                      <td className="px-6 py-4 font-bold text-[#9D4EDD]">{formatarPreco(v.valor)}</td>
                      <td className="px-6 py-4 text-xs">{v.tp_metodo_pagamento}</td>
                      <td className="px-6 py-4 text-xs font-mono text-[#A78BFA]">{v.ds_origem}</td>
                      <td className="px-6 py-4 text-xs text-[#A78BFA]/80">
                        {formatarDataHora(v.ts_criacao, {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        {v.tp_status === "APROVADA" ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                            APROVADA
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/20">
                            PENDENTE
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-[rgba(139,92,246,0.15)]">
            <Pagination
              paginaAtual={paginaTabela}
              totalPaginas={totalPaginas}
              onChange={(p) => setPaginaTabela(p)}
            />
          </div>
        </Reveal>
      )}
    </div>
  );
}
