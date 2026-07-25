"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { registrarLog } from "@/lib/auditoria";
import { revalidatePath } from "next/cache";

function extrairCampos(formData: FormData) {
  const nm_combo = String(formData.get("nm_combo") ?? "").trim();
  const vl_combo = Number(formData.get("vl_combo"));
  const cd_conteudos = formData.getAll("cd_conteudos").map(String);

  if (!nm_combo) throw new Error("Informe o nome do combo.");
  if (!vl_combo || vl_combo <= 0) throw new Error("Informe um valor de combo válido.");
  if (cd_conteudos.length < 2) throw new Error("Selecione ao menos 2 conteúdos para o combo.");

  return { nm_combo, vl_combo, cd_conteudos };
}

export async function criarCombo(formData: FormData) {
  const supabase = createSupabaseAdminClient();
  const campos = extrairCampos(formData);

  const { data, error } = await supabase
    .from("COMBOS_PROMOCIONAIS")
    .insert(campos)
    .select("cd_combo")
    .single();
  if (error) throw new Error(error.message);

  await registrarLog({
    tp_acao: "CRIACAO",
    nm_entidade: "COMBOS_PROMOCIONAIS",
    cd_entidade: data.cd_combo,
    ds_detalhes: { nome: campos.nm_combo },
  });

  revalidatePath("/admin/combos");
}

export async function editarCombo(id: string, formData: FormData) {
  const supabase = createSupabaseAdminClient();
  const campos = extrairCampos(formData);

  const { error } = await supabase
    .from("COMBOS_PROMOCIONAIS")
    .update(campos)
    .eq("cd_combo", id);
  if (error) throw new Error(error.message);

  await registrarLog({
    tp_acao: "EDICAO",
    nm_entidade: "COMBOS_PROMOCIONAIS",
    cd_entidade: id,
    ds_detalhes: { nome: campos.nm_combo },
  });

  revalidatePath("/admin/combos");
}

export async function alternarAtivoCombo(id: string, ativo: boolean) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("COMBOS_PROMOCIONAIS")
    .update({ sn_ativo: ativo })
    .eq("cd_combo", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/combos");
}

export async function removerCombo(id: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("COMBOS_PROMOCIONAIS").delete().eq("cd_combo", id);
  if (error) throw new Error(error.message);

  await registrarLog({ tp_acao: "EXCLUSAO", nm_entidade: "COMBOS_PROMOCIONAIS", cd_entidade: id });

  revalidatePath("/admin/combos");
}
