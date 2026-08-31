"use server";

import { pool } from "@/lib/db";
import { chaveDiaBrasil } from "@/lib/data";
import type { Conteudo, Plano, Venda, TpStatusVenda } from "@/types/database";

// Meia-noite (00:00 em Brasília, UTC-3 fixo — Brasil não tem mais horário de
// verão desde 2019) do dia calendário informado. Sem isso, "início do dia"
// era calculado com getFullYear()/getMonth()/getDate() no fuso do runtime
// (UTC na Vercel), fazendo "Hoje" começar 3h adiantado e incluir parte da
// noite de ontem (horário de Brasília) — justamente o pico de vendas.
function meiaNoiteBrasil(data: Date): Date {
  return new Date(`${chaveDiaBrasil(data)}T00:00:00-03:00`);
}

/**
 * ds_origem vem de um parâmetro livre na URL do anúncio (?origem=...) —
 * quem monta o link decide a grafia, então "Instagram", "instagram" e
 * "INSTAGRAM" acabavam virando 3 linhas separadas nos relatórios e no
 * filtro. Normaliza tudo pra Title Case antes de agrupar/comparar/exibir,
 * assim variação de maiúscula/minúscula deixa de fragmentar a origem.
 */
function normalizarOrigem(valor: string | null): string {
  const bruto = (valor || "Direto / Telegram").trim();
  if (!bruto) return "Direto / Telegram";
  return bruto
    .toLowerCase()
    .split(" ")
    .map((palavra) => (palavra ? palavra[0].toUpperCase() + palavra.slice(1) : palavra))
    .join(" ");
}

export type TipoPeriodoRelatorio =
  | "hoje"
  | "ontem"
  | "7dias"
  | "30dias"
  | "este_mes"
  | "personalizado";

export interface FiltrosRelatorio {
  periodo: TipoPeriodoRelatorio;
  dataInicio?: string;
  dataFim?: string;
  status: "TODAS" | TpStatusVenda;
  origemFilter?: string;
  buscaConteudo?: string;
}

export interface MetricasRelatorio {
  faturamentoTotal: number;
  totalVendas: number;
  vendasAprovadas: number;
  vendasPendentes: number;
  ticketMedio: number;
}

export interface RankingItem {
  cd_conteudo: string;
  nm_titulo: string;
  ds_url_poster: string | null;
  nm_categoria: string;
  total_vendas: number;
  faturamento_total: number;
}

export interface OrigemTelegramItem {
  ds_origem: string;
  total_vendas: number;
  faturamento_total: number;
  ticket_medio: number;
  porcentagem: number;
}

export interface VendaRelatorioItem extends Record<string, unknown> {
  cd_venda: string;
  nr_id_telegram: number;
  tp_compra: string;
  tp_status: string;
  nm_item: string;
  valor: number;
  tp_metodo_pagamento: string;
  ds_origem: string;
  ts_criacao: string;
}

export async function carregarDadosRelatorios(filtros: FiltrosRelatorio) {
  const agora = new Date();

  let inicioIso: string;
  let fimIso: string;

  if (filtros.periodo === "hoje") {
    inicioIso = meiaNoiteBrasil(agora).toISOString();
    fimIso = agora.toISOString();
  } else if (filtros.periodo === "ontem") {
    const ontem = new Date(agora);
    ontem.setDate(ontem.getDate() - 1);
    inicioIso = meiaNoiteBrasil(ontem).toISOString();
    // último instante de ontem = 1ms antes da meia-noite de hoje (Brasília)
    fimIso = new Date(meiaNoiteBrasil(agora).getTime() - 1).toISOString();
  } else if (filtros.periodo === "7dias") {
    const d7 = new Date(agora);
    d7.setDate(d7.getDate() - 7);
    inicioIso = d7.toISOString();
    fimIso = agora.toISOString();
  } else if (filtros.periodo === "30dias") {
    const d30 = new Date(agora);
    d30.setDate(d30.getDate() - 30);
    inicioIso = d30.toISOString();
    fimIso = agora.toISOString();
  } else if (filtros.periodo === "este_mes") {
    const [anoBrasil, mesBrasil] = chaveDiaBrasil(agora).split("-");
    inicioIso = new Date(`${anoBrasil}-${mesBrasil}-01T00:00:00-03:00`).toISOString();
    fimIso = agora.toISOString();
  } else if (filtros.periodo === "personalizado" && filtros.dataInicio && filtros.dataFim) {
    const dIni = new Date(`${filtros.dataInicio}T00:00:00-03:00`);
    const dFim = new Date(`${filtros.dataFim}T23:59:59-03:00`);
    inicioIso = Number.isNaN(dIni.getTime()) ? new Date(0).toISOString() : dIni.toISOString();
    fimIso = Number.isNaN(dFim.getTime()) ? agora.toISOString() : dFim.toISOString();
  } else {
    // padrão hoje
    inicioIso = meiaNoiteBrasil(agora).toISOString();
    fimIso = agora.toISOString();
  }

  const [{ rows: conteudos }, { rows: planos }, { rows: vendas }] = await Promise.all([
    pool.query<Conteudo>('SELECT * FROM "CONTEUDOS"'),
    pool.query<Plano>('SELECT * FROM "PLANOS"'),
    pool.query<Venda>(
      `SELECT * FROM "VENDAS"
       WHERE ts_criacao >= $1 AND ts_criacao <= $2
       ORDER BY ts_criacao DESC`,
      [inicioIso, fimIso]
    ),
  ]);

  const conteudosMap = new Map<string, Conteudo>();
  for (const c of conteudos) conteudosMap.set(c.cd_conteudo, c);

  const planosMap = new Map<string, Plano>();
  for (const p of planos) planosMap.set(p.cd_plano, p);

  const getValorVenda = (v: Venda) => {
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

  // Identificação de QR Codes substituídos/abandonados
  // Se o usuário tem uma venda APROVADA para um item, vendas PENDENTE anteriores daquele item foram QR codes abandonados.
  // Se ele tem múltiplas vendas PENDENTE para o mesmo item sem ter pago nenhuma, só a última conta como tentativa ativa.
  const chaveAprovadas = new Set<string>();
  for (const v of vendas) {
    if (v.tp_status === "APROVADA") {
      const itemKey = `${v.nr_id_telegram}_${v.cd_conteudo || v.cd_plano || v.tp_compra}`;
      chaveAprovadas.add(itemKey);
    }
  }

  const pendentesRecentesMap = new Map<string, string>(); // itemKey -> id da pendente mais recente
  for (const v of vendas) {
    if (v.tp_status === "PENDENTE") {
      const itemKey = `${v.nr_id_telegram}_${v.cd_conteudo || v.cd_plano || v.tp_compra}`;
      if (!pendentesRecentesMap.has(itemKey)) {
        pendentesRecentesMap.set(itemKey, v.cd_venda);
      }
    }
  }

  // Filtragem de status e origem considerando apenas vendas válidas (não desduplicadas por abandono)
  const vendasElegiveis = vendas.filter((v) => {
    const itemKey = `${v.nr_id_telegram}_${v.cd_conteudo || v.cd_plano || v.tp_compra}`;

    if (v.tp_status === "PENDENTE") {
      // Se o cliente já aprovou este item, o QR code anterior foi abandonado/pago em nova tentativa
      if (chaveAprovadas.has(itemKey)) return false;
      // Se gerou múltiplos QR codes pendentes para o mesmo item, considera apenas a última tentativa
      if (pendentesRecentesMap.get(itemKey) !== v.cd_venda) return false;
    }

    return true;
  });

  const vendasFiltradas = vendasElegiveis.filter((v) => {
    if (filtros.status !== "TODAS" && v.tp_status !== filtros.status) return false;
    if (
      filtros.origemFilter &&
      filtros.origemFilter !== "TODAS" &&
      normalizarOrigem(v.ds_origem) !== normalizarOrigem(filtros.origemFilter)
    ) {
      return false;
    }
    return true;
  });

  // Métricas gerais
  const faturamentoTotal = vendasFiltradas
    .filter((v) => v.tp_status === "APROVADA")
    .reduce((acc, v) => acc + getValorVenda(v), 0);

  const totalVendas = vendasFiltradas.length;
  const vendasAprovadas = vendasFiltradas.filter((v) => v.tp_status === "APROVADA").length;
  const vendasPendentes = vendasFiltradas.filter((v) => v.tp_status === "PENDENTE").length;
  const ticketMedio = vendasAprovadas > 0 ? faturamentoTotal / vendasAprovadas : 0;

  // Ranking de conteúdos (apenas compras de conteúdos)
  const rankingMap = new Map<
    string,
    { item: Conteudo; totalVendas: number; faturamento: number }
  >();

  for (const v of vendasFiltradas) {
    if (!v.cd_conteudo) continue;
    const c = conteudosMap.get(v.cd_conteudo);
    if (!c) continue;

    const atual = rankingMap.get(v.cd_conteudo) ?? {
      item: c,
      totalVendas: 0,
      faturamento: 0,
    };

    atual.totalVendas += 1;
    if (v.tp_status === "APROVADA") {
      atual.faturamento += getValorVenda(v);
    }
    rankingMap.set(v.cd_conteudo, atual);
  }

  const rankingConteudos: RankingItem[] = Array.from(rankingMap.values())
    .map(({ item, totalVendas, faturamento }) => ({
      cd_conteudo: item.cd_conteudo,
      nm_titulo: item.nm_titulo,
      ds_url_poster: item.ds_url_poster,
      nm_categoria: item.nm_categoria,
      total_vendas: totalVendas,
      faturamento_total: faturamento,
    }))
    .sort((a, b) => b.total_vendas - a.total_vendas);

  // Rastreamento por Origem Telegram
  const origemMap = new Map<string, { totalVendas: number; faturamento: number }>();
  for (const v of vendasFiltradas) {
    const orig = normalizarOrigem(v.ds_origem);
    const atual = origemMap.get(orig) ?? { totalVendas: 0, faturamento: 0 };
    atual.totalVendas += 1;
    if (v.tp_status === "APROVADA") {
      atual.faturamento += getValorVenda(v);
    }
    origemMap.set(orig, atual);
  }

  const origensTelegram: OrigemTelegramItem[] = Array.from(origemMap.entries())
    .map(([ds_origem, data]) => ({
      ds_origem,
      total_vendas: data.totalVendas,
      faturamento_total: data.faturamento,
      ticket_medio: data.totalVendas > 0 ? data.faturamento / data.totalVendas : 0,
      porcentagem: faturamentoTotal > 0 ? (data.faturamento / faturamentoTotal) * 100 : 0,
    }))
    .sort((a, b) => b.faturamento_total - a.faturamento_total);

  // Lista formatada para a tabela de transações
  const itensTabela: VendaRelatorioItem[] = vendasFiltradas.map((v) => {
    let itemNome = "-";
    if (v.tp_compra === "ASSINATURA") {
      itemNome = (v.cd_plano && planosMap.get(v.cd_plano)?.nm_plano) ?? `Plano #${v.cd_plano}`;
    } else {
      itemNome =
        (v.cd_conteudo && conteudosMap.get(v.cd_conteudo)?.nm_titulo) ??
        `Conteúdo #${v.cd_conteudo}`;
    }

    return {
      cd_venda: v.cd_venda,
      nr_id_telegram: v.nr_id_telegram,
      tp_compra: v.tp_compra,
      tp_status: v.tp_status,
      nm_item: itemNome,
      valor: getValorVenda(v),
      tp_metodo_pagamento: v.tp_metodo_pagamento ?? "PIX",
      ds_origem: normalizarOrigem(v.ds_origem),
      ts_criacao: v.ts_criacao,
    };
  });

  const listaOrigensDisponiveis = Array.from(
    new Set(vendas.map((v) => normalizarOrigem(v.ds_origem)))
  ).sort();

  return {
    metricas: {
      faturamentoTotal,
      totalVendas,
      vendasAprovadas,
      vendasPendentes,
      ticketMedio,
    },
    rankingConteudos,
    origensTelegram,
    vendasTabela: itensTabela,
    listaOrigensDisponiveis,
  };
}

export async function exportarRelatorioCsv(filtros: FiltrosRelatorio): Promise<string> {
  const dados = await carregarDadosRelatorios(filtros);
  const { paraCsv } = await import("@/lib/csv");

  return paraCsv(dados.vendasTabela, [
    { chave: "cd_venda", rotulo: "ID Venda" },
    { chave: "nr_id_telegram", rotulo: "ID Telegram" },
    { chave: "tp_compra", rotulo: "Tipo" },
    { chave: "nm_item", rotulo: "Item" },
    { chave: "valor", rotulo: "Valor (R$)" },
    { chave: "tp_metodo_pagamento", rotulo: "Método" },
    { chave: "ds_origem", rotulo: "Origem Telegram" },
    { chave: "ts_criacao", rotulo: "Data/Hora" },
    { chave: "tp_status", rotulo: "Status" },
  ]);
}
