"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
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
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { TpCompra } from "@/types/database";

async function usuarioAutenticado() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Você precisa estar logado.");
  return { supabase, user };
}

async function calcularDiasValidade(
  supabase: SupabaseClient<Database>,
  tp_compra: TpCompra,
  cd_plano: string | null
) {
  if (tp_compra === "VITALICIO") return DIAS_VITALICIO;
  if (tp_compra === "ASSINATURA" && cd_plano) {
    const { data: plano } = await supabase
      .from("PLANOS")
      .select("nr_dias_validade")
      .eq("cd_plano", cd_plano)
      .maybeSingle();
    return plano?.nr_dias_validade ?? 30;
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
  supabase: SupabaseClient<Database>,
  nr_id_telegram: number,
  tp_compra: TpCompra,
  cd_conteudo: string | null,
  cd_plano: string | null
): Promise<CheckoutPixResultado | null> {
  let query = supabase
    .from("VENDAS")
    .select("cd_venda, ds_txid")
    .eq("nr_id_telegram", nr_id_telegram)
    .eq("tp_compra", tp_compra)
    .eq("tp_status", "PENDENTE")
    .not("ds_txid", "is", null)
    .order("ts_criacao", { ascending: false })
    .limit(1);

  query = cd_conteudo ? query.eq("cd_conteudo", cd_conteudo) : query.eq("cd_plano", cd_plano as string);

  const { data: venda } = await query.maybeSingle();
  if (!venda || !venda.ds_txid) return null;

  const cobranca = await obterCobrancaPixAtiva(venda.ds_txid);
  if (!cobranca) return null;

  return { cd_venda: venda.cd_venda, qrcodeImage: cobranca.qrcodeImage, copiaECola: cobranca.copiaECola };
}

export async function iniciarCheckoutPixConteudo(
  cd_conteudo: string,
  tp_compra: "ALUGUEL" | "VITALICIO"
): Promise<CheckoutPixResultado> {
  const { supabase, user } = await usuarioAutenticado();

  const { data: conteudo } = await supabase
    .from("CONTEUDOS")
    .select("nm_titulo, vl_aluguel, vl_vitalicio")
    .eq("cd_conteudo", cd_conteudo)
    .maybeSingle();
  if (!conteudo) throw new Error("Conteúdo não encontrado.");

  const valor = tp_compra === "ALUGUEL" ? conteudo.vl_aluguel : conteudo.vl_vitalicio;
  if (!valor) throw new Error("Este conteúdo não está disponível para compra.");

  const nr_id_telegram = await obterIdentidadeParaCompra(user);

  const existente = await reaproveitarVendaPixPendente(
    supabase,
    nr_id_telegram,
    tp_compra,
    cd_conteudo,
    null
  );
  if (existente) return existente;

  const cobranca = await criarCobrancaPix(
    valor,
    `${tp_compra === "ALUGUEL" ? "Aluguel" : "Vitalício"}: ${conteudo.nm_titulo}`
  );

  const { data: venda, error } = await supabase
    .from("VENDAS")
    .insert({
      nr_id_telegram,
      tp_compra,
      tp_status: "PENDENTE",
      cd_conteudo,
      cd_plano: null,
      ds_txid: cobranca.txid,
      vl_pago: valor,
    })
    .select("cd_venda")
    .single();

  if (error || !venda) throw new Error(error?.message ?? "Erro ao criar a compra.");

  return { cd_venda: venda.cd_venda, qrcodeImage: cobranca.qrcodeImage, copiaECola: cobranca.copiaECola };
}

export async function iniciarCheckoutPixPlano(cd_plano: string): Promise<CheckoutPixResultado> {
  const { supabase, user } = await usuarioAutenticado();

  const { data: plano } = await supabase
    .from("PLANOS")
    .select("nm_plano, vl_plano")
    .eq("cd_plano", cd_plano)
    .maybeSingle();
  if (!plano) throw new Error("Plano não encontrado.");

  const nr_id_telegram = await obterIdentidadeParaCompra(user);

  const existente = await reaproveitarVendaPixPendente(
    supabase,
    nr_id_telegram,
    "ASSINATURA",
    null,
    cd_plano
  );
  if (existente) return existente;

  const cobranca = await criarCobrancaPix(plano.vl_plano, `Assinatura: ${plano.nm_plano}`);

  const { data: venda, error } = await supabase
    .from("VENDAS")
    .insert({
      nr_id_telegram,
      tp_compra: "ASSINATURA",
      tp_status: "PENDENTE",
      cd_conteudo: null,
      cd_plano,
      ds_txid: cobranca.txid,
      vl_pago: plano.vl_plano,
    })
    .select("cd_venda")
    .single();

  if (error || !venda) throw new Error(error?.message ?? "Erro ao criar a compra.");

  return { cd_venda: venda.cd_venda, qrcodeImage: cobranca.qrcodeImage, copiaECola: cobranca.copiaECola };
}

export type StatusCheckoutPix = "PENDENTE" | "PAGA";

export async function verificarPagamentoPix(cd_venda: string): Promise<StatusCheckoutPix> {
  const { supabase, user } = await usuarioAutenticado();

  const idsDoUsuario = await obterIdsTelegramElegiveis(user);

  const { data: venda } = await supabase
    .from("VENDAS")
    .select("*")
    .eq("cd_venda", cd_venda)
    .maybeSingle();

  if (!venda || !idsDoUsuario.includes(venda.nr_id_telegram)) {
    throw new Error("Compra não encontrada.");
  }

  if (venda.tp_status === "APROVADA") return "PAGA";
  if (!venda.ds_txid) return "PENDENTE";

  const status = await consultarCobrancaPix(venda.ds_txid);
  if (status !== "PAGA") return "PENDENTE";

  const dias = await calcularDiasValidade(supabase, venda.tp_compra, venda.cd_plano);

  await supabase
    .from("VENDAS")
    .update({ tp_status: "APROVADA", ts_expiracao: somarDias(dias) })
    .eq("cd_venda", cd_venda);

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
  supabase: SupabaseClient<Database>,
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
  const taxa = await obterTaxaCartao(supabase);
  const total = valorBase + taxa;

  const resultado = await criarCobrancaCartao({
    valor: total,
    descricao,
    paymentToken,
    installments,
    cliente,
  });

  if (resultado.status === "RECUSADO") {
    await supabase.from("TENTATIVAS_CARTAO_RECUSADAS").insert({
      nr_id_telegram,
      cd_conteudo,
      cd_plano,
      tp_compra,
      vl_tentativa: total,
      ds_motivo: resultado.motivoRecusa ?? null,
    });
    return { status: "RECUSADO", motivoRecusa: resultado.motivoRecusa };
  }

  const dias = await calcularDiasValidade(supabase, tp_compra, cd_plano);
  const tp_status = resultado.status === "APROVADO" ? "APROVADA" : "PENDENTE";

  await supabase.from("VENDAS").insert({
    nr_id_telegram,
    tp_compra,
    tp_status,
    cd_conteudo,
    cd_plano,
    ds_txid: resultado.chargeId,
    ts_expiracao: tp_status === "APROVADA" ? somarDias(dias) : null,
    vl_pago: total,
  });

  return { status: resultado.status };
}

export async function iniciarCheckoutCartaoConteudo(
  cd_conteudo: string,
  tp_compra: "ALUGUEL" | "VITALICIO",
  paymentToken: string,
  cliente: DadosClienteCartao,
  installments?: number
): Promise<CheckoutCartaoResultado> {
  const { supabase, user } = await usuarioAutenticado();

  const { data: conteudo } = await supabase
    .from("CONTEUDOS")
    .select("nm_titulo, vl_aluguel, vl_vitalicio")
    .eq("cd_conteudo", cd_conteudo)
    .maybeSingle();
  if (!conteudo) throw new Error("Conteúdo não encontrado.");

  const valor = tp_compra === "ALUGUEL" ? conteudo.vl_aluguel : conteudo.vl_vitalicio;
  if (!valor) throw new Error("Este conteúdo não está disponível para compra.");

  const nr_id_telegram = await obterIdentidadeParaCompra(user);

  return finalizarCompraCartao(
    supabase,
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
  const { supabase, user } = await usuarioAutenticado();

  const { data: plano } = await supabase
    .from("PLANOS")
    .select("nm_plano, vl_plano")
    .eq("cd_plano", cd_plano)
    .maybeSingle();
  if (!plano) throw new Error("Plano não encontrado.");

  const nr_id_telegram = await obterIdentidadeParaCompra(user);

  return finalizarCompraCartao(
    supabase,
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
  const supabase = await createSupabaseServerClient();
  return obterTaxaCartao(supabase);
}
