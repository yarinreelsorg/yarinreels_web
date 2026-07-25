"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { registrarLog } from "@/lib/auditoria";
import { revalidatePath } from "next/cache";
import type { Plano } from "@/types/database";

const parseNumber = (val: unknown) => {
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

function extrairCampos(formData: FormData) {
  const nm_plano = String(formData.get("nm_plano") ?? "").trim();
  const nm_categoria = String(formData.get("nm_categoria") ?? "").trim();
  const vl_plano = parseNumber(formData.get("vl_plano"));
  const nr_dias_validade = parseNumber(formData.get("nr_dias_validade"));

  if (!nm_plano || !nm_categoria) {
    throw new Error("Preencha nome e categoria do plano.");
  }
  if (vl_plano <= 0 || nr_dias_validade <= 0) {
    throw new Error("Valor e dias de validade devem ser maiores que zero.");
  }

  return { nm_plano, nm_categoria, vl_plano, nr_dias_validade };
}

export async function criarPlano(formData: FormData) {
  const supabase = createSupabaseAdminClient();
  const campos = extrairCampos(formData);

  const { data, error } = await supabase.from("PLANOS").insert(campos).select("cd_plano").single();
  if (error) throw new Error(error.message);

  await registrarLog({
    tp_acao: "CRIACAO",
    nm_entidade: "PLANOS",
    cd_entidade: data.cd_plano,
    ds_detalhes: { nome: campos.nm_plano },
  });

  revalidatePath("/admin/planos");
  revalidatePath("/assinaturas");
}

export async function editarPlano(id: string, formData: FormData) {
  const supabase = createSupabaseAdminClient();
  const campos = extrairCampos(formData);

  const { error } = await supabase.from("PLANOS").update(campos).eq("cd_plano", id);
  if (error) throw new Error(error.message);

  await registrarLog({
    tp_acao: "EDICAO",
    nm_entidade: "PLANOS",
    cd_entidade: id,
    ds_detalhes: { nome: campos.nm_plano },
  });

  revalidatePath("/admin/planos");
  revalidatePath("/assinaturas");
}

export async function removerPlano(id: string) {
  const supabase = createSupabaseAdminClient();

  const { data: registro } = await supabase.from("PLANOS").select("*").eq("cd_plano", id).maybeSingle();

  const { error } = await supabase.from("PLANOS").delete().eq("cd_plano", id);
  if (error) throw new Error(error.message);

  if (registro) {
    await registrarLog({
      tp_acao: "EXCLUSAO",
      nm_entidade: "PLANOS",
      cd_entidade: id,
      ds_detalhes: { ...registro },
    });
  }

  revalidatePath("/admin/planos");
  revalidatePath("/assinaturas");
}

export async function restaurarPlano(snapshot: Plano) {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("PLANOS").insert(snapshot);
  if (error) throw new Error(error.message);

  await registrarLog({
    tp_acao: "RESTAURACAO",
    nm_entidade: "PLANOS",
    cd_entidade: snapshot.cd_plano,
    ds_detalhes: { nome: snapshot.nm_plano },
  });

  revalidatePath("/admin/planos");
  revalidatePath("/admin/auditoria");
  revalidatePath("/assinaturas");
}
