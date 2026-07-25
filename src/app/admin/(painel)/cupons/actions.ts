"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { registrarLog } from "@/lib/auditoria";
import { revalidatePath } from "next/cache";
import type { TpDesconto } from "@/types/database";

function extrairCampos(formData: FormData) {
  const cd_codigo = String(formData.get("cd_codigo") ?? "").trim().toUpperCase();
  const tp_desconto = formData.get("tp_desconto") as TpDesconto;
  const vl_desconto = Number(formData.get("vl_desconto"));
  const usosMaximoRaw = String(formData.get("nr_usos_maximo") ?? "").trim();
  const dataValidadeRaw = String(formData.get("dt_validade") ?? "").trim();

  if (!cd_codigo) throw new Error("Informe o código do cupom.");
  if (tp_desconto !== "PERCENTUAL" && tp_desconto !== "FIXO") {
    throw new Error("Selecione o tipo de desconto.");
  }
  if (!vl_desconto || vl_desconto <= 0) throw new Error("Informe um valor de desconto válido.");
  if (tp_desconto === "PERCENTUAL" && vl_desconto > 100) {
    throw new Error("Desconto percentual não pode passar de 100%.");
  }

  return {
    cd_codigo,
    tp_desconto,
    vl_desconto,
    nr_usos_maximo: usosMaximoRaw ? Number(usosMaximoRaw) : null,
    dt_validade: dataValidadeRaw || null,
  };
}

export async function criarCupom(formData: FormData) {
  const supabase = createSupabaseAdminClient();
  const campos = extrairCampos(formData);

  const { data, error } = await supabase.from("CUPONS").insert(campos).select("cd_cupom").single();
  if (error) {
    throw new Error(error.code === "23505" ? "Já existe um cupom com esse código." : error.message);
  }

  await registrarLog({
    tp_acao: "CRIACAO",
    nm_entidade: "CUPONS",
    cd_entidade: data.cd_cupom,
    ds_detalhes: { codigo: campos.cd_codigo },
  });

  revalidatePath("/admin/cupons");
}

export async function editarCupom(id: string, formData: FormData) {
  const supabase = createSupabaseAdminClient();
  const campos = extrairCampos(formData);

  const { error } = await supabase.from("CUPONS").update(campos).eq("cd_cupom", id);
  if (error) {
    throw new Error(error.code === "23505" ? "Já existe um cupom com esse código." : error.message);
  }

  await registrarLog({
    tp_acao: "EDICAO",
    nm_entidade: "CUPONS",
    cd_entidade: id,
    ds_detalhes: { codigo: campos.cd_codigo },
  });

  revalidatePath("/admin/cupons");
}

export async function alternarAtivoCupom(id: string, ativo: boolean) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("CUPONS").update({ sn_ativo: ativo }).eq("cd_cupom", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/cupons");
}

export async function removerCupom(id: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("CUPONS").delete().eq("cd_cupom", id);
  if (error) throw new Error(error.message);

  await registrarLog({ tp_acao: "EXCLUSAO", nm_entidade: "CUPONS", cd_entidade: id });

  revalidatePath("/admin/cupons");
}
