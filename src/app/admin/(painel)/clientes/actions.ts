"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DIAS_ALUGUEL, DIAS_VITALICIO, somarDias } from "@/lib/acesso";
import type { TpCompra } from "@/types/database";

export async function concederAcesso(formData: FormData) {
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

  const { error } = await supabase.from("VENDAS").insert({
    nr_id_telegram,
    tp_compra,
    tp_status: "APROVADA",
    cd_conteudo: tp_compra === "ASSINATURA" ? null : cd_conteudo,
    cd_plano: tp_compra === "ASSINATURA" ? cd_plano : null,
    ts_expiracao,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/admin/clientes");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/financeiro");
}
