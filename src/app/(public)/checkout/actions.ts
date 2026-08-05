"use server";

import { headers } from "next/headers";
import { pool } from "@/lib/db";
import { getSessaoUsuario } from "@/lib/user-auth";
import {
  DIAS_ALUGUEL,
  DIAS_VITALICIO,
  obterIdentidadeParaCompra,
  obterIdsTelegramElegiveis,
  somarDias,
} from "@/lib/acesso";
import { obterTaxaCartao } from "@/lib/pagamento";
import {
  consultarCobrancaPix,
  criarCobrancaCartao,
  criarCobrancaPix,
  obterCobrancaPixAtiva,
} from "@/lib/efi/client";
import type { TpCompra } from "@/types/database";

async function usuarioAutenticado() {
  const sessao = await getSessaoUsuario();
  if (!sessao) throw new Error("Você precisa estar logado.");
  return sessao;
}

// Versão do texto de /termos em vigor — bump isso sempre que o texto mudar,
// pra o log de consentimento continuar refletindo o que a pessoa leu de fato.
const VERSAO_TERMOS = "2026-08-05";

/**
 * Registra que o cliente aceitou os Termos de Uso / Política de Reembolso
 * antes de pagar — prova documental pra contestar chargebacks fraudulentos
 * (cliente assiste e depois pede o dinheiro de volta alegando desconhecer
 * a política de não-reembolso de produto digital).
 */
export async function registrarConsentimentoTermos(contexto: string) {
  const sessao = await usuarioAutenticado();
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
  const userAgent = h.get("user-agent");

  await pool.query(
    `INSERT INTO "CONSENTIMENTOS_TERMOS"
       (cd_usuario, nm_email, ds_contexto, nm_versao_termos, ds_ip, ds_user_agent)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [sessao.cd_usuario, sessao.nm_email, contexto, VERSAO_TERMOS, ip, userAgent]
  );
}

async function calcularDiasValidade(tp_compra: TpCompra, cd_plano: string | null) {
  if (tp_compra === "VITALICIO") return DIAS_VITALICIO;
  if (tp_compra === "ASSINATURA" && cd_plano) {
    const { rows } = await pool.query<{ nr_dias_validade: number }>(
      'SELECT nr_dias_validade FROM "PLANOS" WHERE cd_plano = $1 LIMIT 1',
      [cd_plano]
    );
    return rows[0]?.nr_dias_validade ?? 30;
  }
  return DIAS_ALUGUEL;
}

// ---------- Pix ----------

export interface CheckoutPixResultado {
  cd_venda: string;
  qrcodeImage: string;
  copiaECola: string;
}

/**
 * Procura uma venda PENDENTE já criada para essa mesma compra (mesmo
 * usuário + mesmo conteúdo/plano) cuja cobrança Pix na Efí ainda esteja
 * ativa, e devolve o QR Code dela em vez de gerar uma cobrança nova — evita
 * cobranças órfãs quando o usuário recarrega a página de checkout.
 */
async function reaproveitarVendaPixPendente(
  nr_id_telegram: number,
  tp_compra: TpCompra,
  cd_conteudo: string | null,
  cd_plano: string | null
): Promise<CheckoutPixResultado | null> {
  const filtroItem = cd_conteudo
    ? { coluna: "cd_conteudo", valor: cd_conteudo }
    : { coluna: "cd_plano", valor: cd_plano as string };

  const { rows } = await pool.query<{ cd_venda: string; ds_txid: string | null }>(
    `SELECT cd_venda, ds_txid FROM "VENDAS"
     WHERE nr_id_telegram = $1 AND tp_compra = $2 AND tp_status = 'PENDENTE'
       AND ds_txid IS NOT NULL AND ${filtroItem.coluna} = $3
     ORDER BY ts_criacao DESC LIMIT 1`,
    [nr_id_telegram, tp_compra, filtroItem.valor]
  );
  const venda = rows[0];
  if (!venda || !venda.ds_txid) return null;

  const cobranca = await obterCobrancaPixAtiva(venda.ds_txid);
  if (!cobranca) return null;

  return { cd_venda: venda.cd_venda, qrcodeImage: cobranca.qrcodeImage, copiaECola: cobranca.copiaECola };
}

export async function iniciarCheckoutPixConteudo(
  cd_conteudo: string,
  tp_compra: "ALUGUEL" | "VITALICIO"
): Promise<CheckoutPixResultado> {
  const sessao = await usuarioAutenticado();

  const { rows: conteudos } = await pool.query<{
    nm_titulo: string;
    vl_aluguel: number | null;
    vl_vitalicio: number | null;
  }>('SELECT nm_titulo, vl_aluguel, vl_vitalicio FROM "CONTEUDOS" WHERE cd_conteudo = $1 LIMIT 1', [
    cd_conteudo,
  ]);
  const conteudo = conteudos[0];
  if (!conteudo) throw new Error("Conteúdo não encontrado.");

  const valor = tp_compra === "ALUGUEL" ? conteudo.vl_aluguel : conteudo.vl_vitalicio;
  if (!valor) throw new Error("Este conteúdo não está disponível para compra.");

  const nr_id_telegram = await obterIdentidadeParaCompra(sessao.cd_usuario);

  const existente = await reaproveitarVendaPixPendente(nr_id_telegram, tp_compra, cd_conteudo, null);
  if (existente) return existente;

  const cobranca = await criarCobrancaPix(
    valor,
    `${tp_compra === "ALUGUEL" ? "Aluguel" : "Vitalício"}: ${conteudo.nm_titulo}`
  );

  const { rows: vendas } = await pool.query<{ cd_venda: string }>(
    `INSERT INTO "VENDAS"
       (nr_id_telegram, tp_compra, tp_status, cd_conteudo, cd_plano, ds_txid, vl_pago, tp_metodo_pagamento)
     VALUES ($1, $2, 'PENDENTE', $3, NULL, $4, $5, 'PIX')
     RETURNING cd_venda`,
    [nr_id_telegram, tp_compra, cd_conteudo, cobranca.txid, valor]
  );
  const venda = vendas[0];
  if (!venda) throw new Error("Erro ao criar a compra.");

  return { cd_venda: venda.cd_venda, qrcodeImage: cobranca.qrcodeImage, copiaECola: cobranca.copiaECola };
}

export async function iniciarCheckoutPixPlano(cd_plano: string): Promise<CheckoutPixResultado> {
  const sessao = await usuarioAutenticado();

  const { rows: planos } = await pool.query<{ nm_plano: string; vl_plano: number }>(
    'SELECT nm_plano, vl_plano FROM "PLANOS" WHERE cd_plano = $1 LIMIT 1',
    [cd_plano]
  );
  const plano = planos[0];
  if (!plano) throw new Error("Plano não encontrado.");

  const nr_id_telegram = await obterIdentidadeParaCompra(sessao.cd_usuario);

  const existente = await reaproveitarVendaPixPendente(nr_id_telegram, "ASSINATURA", null, cd_plano);
  if (existente) return existente;

  const cobranca = await criarCobrancaPix(plano.vl_plano, `Assinatura: ${plano.nm_plano}`);

  const { rows: vendas } = await pool.query<{ cd_venda: string }>(
    `INSERT INTO "VENDAS"
       (nr_id_telegram, tp_compra, tp_status, cd_conteudo, cd_plano, ds_txid, vl_pago, tp_metodo_pagamento)
     VALUES ($1, 'ASSINATURA', 'PENDENTE', NULL, $2, $3, $4, 'PIX')
     RETURNING cd_venda`,
    [nr_id_telegram, cd_plano, cobranca.txid, plano.vl_plano]
  );
  const venda = vendas[0];
  if (!venda) throw new Error("Erro ao criar a compra.");

  return { cd_venda: venda.cd_venda, qrcodeImage: cobranca.qrcodeImage, copiaECola: cobranca.copiaECola };
}

export type StatusCheckoutPix = "PENDENTE" | "PAGA";

export async function verificarPagamentoPix(cd_venda: string): Promise<StatusCheckoutPix> {
  const sessao = await usuarioAutenticado();

  const idsDoUsuario = await obterIdsTelegramElegiveis(sessao.cd_usuario);

  const { rows } = await pool.query<{
    nr_id_telegram: number;
    tp_status: string;
    ds_txid: string | null;
    tp_compra: TpCompra;
    cd_plano: string | null;
  }>('SELECT * FROM "VENDAS" WHERE cd_venda = $1 LIMIT 1', [cd_venda]);
  const venda = rows[0];

  if (!venda || !idsDoUsuario.includes(venda.nr_id_telegram)) {
    throw new Error("Compra não encontrada.");
  }

  if (venda.tp_status === "APROVADA") return "PAGA";
  if (!venda.ds_txid) return "PENDENTE";

  const status = await consultarCobrancaPix(venda.ds_txid);
  if (status !== "PAGA") return "PENDENTE";

  const dias = await calcularDiasValidade(venda.tp_compra, venda.cd_plano);

  await pool.query(
    `UPDATE "VENDAS" SET tp_status = 'APROVADA', ts_expiracao = $1 WHERE cd_venda = $2`,
    [somarDias(dias), cd_venda]
  );

  return "PAGA";
}

// ---------- Cartão ----------

export interface DadosClienteCartao {
  email: string;
  nome?: string;
  cpf?: string;
  telefone?: string;
}

export interface CheckoutCartaoResultado {
  status: "APROVADO" | "RECUSADO" | "PROCESSANDO";
  motivoRecusa?: string;
}

async function finalizarCompraCartao(
  nr_id_telegram: number,
  tp_compra: TpCompra,
  cd_conteudo: string | null,
  cd_plano: string | null,
  valorBase: number,
  descricao: string,
  paymentToken: string,
  cliente: DadosClienteCartao,
  installments?: number
): Promise<CheckoutCartaoResultado> {
  const taxa = await obterTaxaCartao();
  const total = valorBase + taxa;

  const resultado = await criarCobrancaCartao({
    valor: total,
    descricao,
    paymentToken,
    installments,
    cliente,
  });

  if (resultado.status === "RECUSADO") {
    await pool.query(
      `INSERT INTO "TENTATIVAS_CARTAO_RECUSADAS"
         (nr_id_telegram, cd_conteudo, cd_plano, tp_compra, vl_tentativa, ds_motivo)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [nr_id_telegram, cd_conteudo, cd_plano, tp_compra, total, resultado.motivoRecusa ?? null]
    );
    return { status: "RECUSADO", motivoRecusa: resultado.motivoRecusa };
  }

  const dias = await calcularDiasValidade(tp_compra, cd_plano);
  const tp_status = resultado.status === "APROVADO" ? "APROVADA" : "PENDENTE";

  await pool.query(
    `INSERT INTO "VENDAS"
       (nr_id_telegram, tp_compra, tp_status, cd_conteudo, cd_plano, ds_txid, ts_expiracao, vl_pago, tp_metodo_pagamento)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'CARTAO')`,
    [
      nr_id_telegram,
      tp_compra,
      tp_status,
      cd_conteudo,
      cd_plano,
      resultado.chargeId ?? null,
      tp_status === "APROVADA" ? somarDias(dias) : null,
      total,
    ]
  );

  return { status: resultado.status };
}

export async function iniciarCheckoutCartaoConteudo(
  cd_conteudo: string,
  tp_compra: "ALUGUEL" | "VITALICIO",
  paymentToken: string,
  cliente: DadosClienteCartao,
  installments?: number
): Promise<CheckoutCartaoResultado> {
  const sessao = await usuarioAutenticado();

  const { rows: conteudos } = await pool.query<{
    nm_titulo: string;
    vl_aluguel: number | null;
    vl_vitalicio: number | null;
  }>('SELECT nm_titulo, vl_aluguel, vl_vitalicio FROM "CONTEUDOS" WHERE cd_conteudo = $1 LIMIT 1', [
    cd_conteudo,
  ]);
  const conteudo = conteudos[0];
  if (!conteudo) throw new Error("Conteúdo não encontrado.");

  const valor = tp_compra === "ALUGUEL" ? conteudo.vl_aluguel : conteudo.vl_vitalicio;
  if (!valor) throw new Error("Este conteúdo não está disponível para compra.");

  const nr_id_telegram = await obterIdentidadeParaCompra(sessao.cd_usuario);

  return finalizarCompraCartao(
    nr_id_telegram,
    tp_compra,
    cd_conteudo,
    null,
    valor,
    `${tp_compra === "ALUGUEL" ? "Aluguel" : "Vitalício"}: ${conteudo.nm_titulo}`,
    paymentToken,
    cliente,
    installments
  );
}

export async function iniciarCheckoutCartaoPlano(
  cd_plano: string,
  paymentToken: string,
  cliente: DadosClienteCartao,
  installments?: number
): Promise<CheckoutCartaoResultado> {
  const sessao = await usuarioAutenticado();

  const { rows: planos } = await pool.query<{ nm_plano: string; vl_plano: number }>(
    'SELECT nm_plano, vl_plano FROM "PLANOS" WHERE cd_plano = $1 LIMIT 1',
    [cd_plano]
  );
  const plano = planos[0];
  if (!plano) throw new Error("Plano não encontrado.");

  const nr_id_telegram = await obterIdentidadeParaCompra(sessao.cd_usuario);

  return finalizarCompraCartao(
    nr_id_telegram,
    "ASSINATURA",
    null,
    cd_plano,
    plano.vl_plano,
    `Assinatura: ${plano.nm_plano}`,
    paymentToken,
    cliente,
    installments
  );
}

export async function obterTaxaCartaoAtual(): Promise<number> {
  return obterTaxaCartao();
}
