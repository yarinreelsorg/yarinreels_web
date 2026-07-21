"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { TpFontePrioritaria, TpFormato } from "@/types/database";

const parseNumber = (val: unknown) => {
  if (val === null || val === undefined || val === "") return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
};

const parseString = (val: unknown) => {
  if (val === null || val === undefined || val === "") return null;
  return String(val);
};

export async function adicionarConteudo(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const nm_titulo = parseString(formData.get("nm_titulo")) ?? "";
  const nm_categoria = parseString(formData.get("nm_categoria")) ?? "Geral";
  const tp_formato = parseString(formData.get("tp_formato")) ?? "FILME";
  const nm_idioma = parseString(formData.get("nm_idioma"));
  const ds_generos = parseString(formData.get("ds_generos"));
  const ds_descricao = parseString(formData.get("ds_descricao"));
  const vl_aluguel = parseNumber(formData.get("vl_aluguel"));
  const vl_vitalicio = parseNumber(formData.get("vl_vitalicio"));
  const ds_url_poster = parseString(formData.get("ds_url_poster"));
  const ds_url_bunny = parseString(formData.get("ds_url_bunny"));
  const ds_file_id_telegram = parseString(formData.get("ds_file_id_telegram"));
  const tp_fonte_prioritaria = parseString(formData.get("tp_fonte_prioritaria")) ?? "LOCAL";
  const sn_destaque = formData.get("sn_destaque") === "on" || formData.get("sn_destaque") === "true";
  const dt_lancamento = parseString(formData.get("dt_lancamento"));

  const { error } = await supabase.from("CONTEUDOS").insert({
    nm_titulo,
    nm_categoria,
    tp_formato: tp_formato as TpFormato,
    nm_idioma,
    ds_generos,
    ds_descricao,
    vl_aluguel,
    vl_vitalicio,
    ds_url_poster,
    ds_url_bunny,
    ds_file_id_telegram,
    tp_fonte_prioritaria: tp_fonte_prioritaria as TpFontePrioritaria,
    sn_destaque,
    dt_lancamento,
    nr_views: 0,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/catalogo");
  revalidatePath("/");
}

export async function editarConteudo(id: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const nm_titulo = parseString(formData.get("nm_titulo")) ?? "";
  const nm_categoria = parseString(formData.get("nm_categoria")) ?? "Geral";
  const tp_formato = parseString(formData.get("tp_formato")) ?? "FILME";
  const nm_idioma = parseString(formData.get("nm_idioma"));
  const ds_generos = parseString(formData.get("ds_generos"));
  const ds_descricao = parseString(formData.get("ds_descricao"));
  const vl_aluguel = parseNumber(formData.get("vl_aluguel"));
  const vl_vitalicio = parseNumber(formData.get("vl_vitalicio"));
  const ds_url_poster = parseString(formData.get("ds_url_poster"));
  const ds_url_bunny = parseString(formData.get("ds_url_bunny"));
  const ds_file_id_telegram = parseString(formData.get("ds_file_id_telegram"));
  const tp_fonte_prioritaria = parseString(formData.get("tp_fonte_prioritaria")) ?? "LOCAL";
  const sn_destaque = formData.get("sn_destaque") === "on" || formData.get("sn_destaque") === "true";
  const dt_lancamento = parseString(formData.get("dt_lancamento"));

  const { error } = await supabase
    .from("CONTEUDOS")
    .update({
      nm_titulo,
      nm_categoria,
      tp_formato: tp_formato as TpFormato,
      nm_idioma,
      ds_generos,
      ds_descricao,
      vl_aluguel,
      vl_vitalicio,
      ds_url_poster,
      ds_url_bunny,
      ds_file_id_telegram,
      tp_fonte_prioritaria: tp_fonte_prioritaria as TpFontePrioritaria,
      sn_destaque,
      dt_lancamento,
    })
    .eq("cd_conteudo", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/catalogo");
  revalidatePath("/");
}

export async function removerConteudo(id: string) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("CONTEUDOS")
    .delete()
    .eq("cd_conteudo", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/catalogo");
  revalidatePath("/");
}

export async function toggleDestaque(id: string, valor: boolean) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("CONTEUDOS")
    .update({ sn_destaque: valor })
    .eq("cd_conteudo", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/catalogo");
  revalidatePath("/");
}
