"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const parseNumber = (val: unknown) => {
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

export async function criarPlano(formData: FormData) {
  const supabase = await createSupabaseServerClient();

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

  const { error } = await supabase.from("PLANOS").insert({
    nm_plano,
    nm_categoria,
    vl_plano,
    nr_dias_validade,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/admin/planos");
  revalidatePath("/assinaturas");
}

export async function editarPlano(id: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();

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

  const { error } = await supabase
    .from("PLANOS")
    .update({ nm_plano, nm_categoria, vl_plano, nr_dias_validade })
    .eq("cd_plano", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/planos");
  revalidatePath("/assinaturas");
}

export async function removerPlano(id: string) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("PLANOS").delete().eq("cd_plano", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/planos");
  revalidatePath("/assinaturas");
}
