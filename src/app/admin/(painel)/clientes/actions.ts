"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DIAS_ALUGUEL, DIAS_VITALICIO, somarDias } from "@/lib/acesso";
import { registrarLog } from "@/lib/auditoria";
import type { TpCompra, Venda } from "@/types/database";

export async function buscarVendasCliente(nrIdTelegram: number): Promise<Venda[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("VENDAS")
    .select("*")
    .eq("nr_id_telegram", nrIdTelegram)
    .order("ts_criacao", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function concederAcesso(formData: FormData, forcar = false) {
  const nr_id_telegram = Number(formData.get("nr_id_telegram"));
  const tp_compra = formData.get("tp_compra") as TpCompra;
  const cd_conteudo = String(formData.get("cd_conteudo") ?? "").trim() || null;
  const cd_plano = String(formData.get("cd_plano") ?? "").trim() || null;

  if (!nr_id_telegram || Number.isNaN(nr_id_telegram)) {
    throw new Error("Informe um ID do Telegram válido.");
  }
  if (!tp_compra) {
    throw new Error("Selecione o tipo de acesso.");
  }

  const supabase = createSupabaseAdminClient();

  let ts_expiracao: string;

  if (tp_compra === "ALUGUEL") {
    if (!cd_conteudo) throw new Error("Selecione o conteúdo para liberar o aluguel.");
    ts_expiracao = somarDias(DIAS_ALUGUEL);
  } else if (tp_compra === "VITALICIO") {
    if (!cd_conteudo) throw new Error("Selecione o conteúdo para liberar o acesso vitalício.");
    ts_expiracao = somarDias(DIAS_VITALICIO);
  } else if (tp_compra === "ASSINATURA") {
    if (!cd_plano) throw new Error("Selecione o plano de assinatura.");
    const { data: plano, error: erroPlano } = await supabase
      .from("PLANOS")
      .select("nr_dias_validade")
      .eq("cd_plano", cd_plano)
      .maybeSingle();
    if (erroPlano || !plano) throw new Error("Plano não encontrado.");
    ts_expiracao = somarDias(plano.nr_dias_validade);
  } else {
    throw new Error("Tipo de acesso inválido.");
  }

  if (!forcar) {
    const agoraIso = new Date().toISOString();
    let queryDuplicidade = supabase
      .from("VENDAS")
      .select("ts_expiracao")
      .eq("nr_id_telegram", nr_id_telegram)
      .eq("tp_compra", tp_compra)
      .eq("tp_status", "APROVADA")
      .gt("ts_expiracao", agoraIso)
      .order("ts_expiracao", { ascending: false })
      .limit(1);

    queryDuplicidade =
      tp_compra === "ASSINATURA"
        ? queryDuplicidade.eq("cd_plano", cd_plano as string)
        : queryDuplicidade.eq("cd_conteudo", cd_conteudo as string);

    const { data: existente } = await queryDuplicidade.maybeSingle();

    if (existente?.ts_expiracao) {
      const dataFormatada = new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(existente.ts_expiracao));
      throw new Error(
        `DUPLICADO: Este cliente já tem acesso ativo a isso até ${dataFormatada}.`
      );
    }
  }

  const { error } = await supabase.from("VENDAS").insert({
    nr_id_telegram,
    tp_compra,
    tp_status: "APROVADA",
    cd_conteudo: tp_compra === "ASSINATURA" ? null : cd_conteudo,
    cd_plano: tp_compra === "ASSINATURA" ? cd_plano : null,
    ts_expiracao,
  });

  if (error) throw new Error(error.message);

  await registrarLog({
    tp_acao: "CONCESSAO_ACESSO",
    nm_entidade: "VENDAS",
    ds_detalhes: { nr_id_telegram, tp_compra, cd_conteudo, cd_plano, ts_expiracao },
  });

  revalidatePath("/admin/clientes");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/financeiro");
}

export async function buscarUltimaVisita(nrIdTelegram: number) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("VISITAS")
    .select("ds_dispositivo, ds_ip, ts_criacao")
    .eq("nr_id_telegram", nrIdTelegram)
    .order("ts_criacao", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

export async function verificarBanido(nrIdTelegram: number): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  const { count } = await supabase
    .from("BANS")
    .select("*", { count: "exact", head: true })
    .eq("nr_id_telegram", nrIdTelegram);
  return (count ?? 0) > 0;
}

export async function banirCliente(nrIdTelegram: number) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("BANS").insert({ nr_id_telegram: nrIdTelegram });
  if (error && error.code !== "23505") throw new Error(error.message);

  await registrarLog({
    tp_acao: "BANIMENTO",
    nm_entidade: "BANS",
    cd_entidade: String(nrIdTelegram),
  });

  revalidatePath("/admin/clientes");
}

export async function desbanirCliente(nrIdTelegram: number) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("BANS").delete().eq("nr_id_telegram", nrIdTelegram);
  if (error) throw new Error(error.message);

  await registrarLog({
    tp_acao: "DESBANIMENTO",
    nm_entidade: "BANS",
    cd_entidade: String(nrIdTelegram),
  });

  revalidatePath("/admin/clientes");
}

/** Revoga uma venda aprovada antes do prazo — expira ela imediatamente. */
export async function revogarAcesso(cdVenda: string) {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("VENDAS")
    .update({ ts_expiracao: new Date().toISOString() })
    .eq("cd_venda", cdVenda);

  if (error) throw new Error(error.message);

  await registrarLog({
    tp_acao: "REVOGACAO_ACESSO",
    nm_entidade: "VENDAS",
    cd_entidade: cdVenda,
  });

  revalidatePath("/admin/clientes");
  revalidatePath("/admin/dashboard");
}

export async function exportarClientesCsv(busca?: string): Promise<string> {
  const supabase = createSupabaseAdminClient();

  let query = supabase.from("vw_clientes").select("*");
  if (busca) query = query.ilike("id_telegram_texto", `%${busca}%`);
  query = query.order("ultima_compra", { ascending: false });

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const { paraCsv } = await import("@/lib/csv");
  return paraCsv(data ?? [], [
    { chave: "nr_id_telegram", rotulo: "ID Telegram" },
    { chave: "total_compras", rotulo: "Total de Compras" },
    { chave: "ultima_compra", rotulo: "Última Compra" },
    { chave: "tipos_acesso", rotulo: "Tipos de Acesso" },
  ]);
}
