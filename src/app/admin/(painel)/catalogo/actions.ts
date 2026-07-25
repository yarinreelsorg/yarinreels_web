"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { enviarPoster } from "@/lib/supabase/storage";
import { registrarLog } from "@/lib/auditoria";
import { revalidatePath } from "next/cache";
import type { Conteudo, TpFontePrioritaria, TpFormato } from "@/types/database";

const parseNumber = (val: unknown) => {
  if (val === null || val === undefined || val === "") return null;
  const num = Number(val);
  if (isNaN(num)) return null;
  return num;
};

const parseString = (val: unknown) => {
  if (val === null || val === undefined || val === "") return null;
  return String(val);
};

const REGEX_TELEGRAM_FILE_ID = /^[A-Za-z0-9_-]{10,}$/;

function validarUrlBunny(valor: string | null) {
  if (!valor) return;
  try {
    const url = new URL(valor);
    if (url.protocol !== "https:") throw new Error();
  } catch {
    throw new Error("URL do Bunny inválida — precisa ser uma URL https:// completa.");
  }
}

function validarTelegramFileId(valor: string | null) {
  if (!valor) return;
  if (!REGEX_TELEGRAM_FILE_ID.test(valor)) {
    throw new Error("Telegram File ID inválido — use apenas letras, números, _ e -.");
  }
}

function validarPreco(valor: number | null, campo: string) {
  if (valor !== null && valor < 0) {
    throw new Error(`${campo} não pode ser negativo.`);
  }
}

function extrairCampos(formData: FormData) {
  const ds_url_bunny = parseString(formData.get("ds_url_bunny"));
  const ds_file_id_telegram = parseString(formData.get("ds_file_id_telegram"));
  const vl_aluguel = parseNumber(formData.get("vl_aluguel"));
  const vl_vitalicio = parseNumber(formData.get("vl_vitalicio"));

  validarUrlBunny(ds_url_bunny);
  validarTelegramFileId(ds_file_id_telegram);
  validarPreco(vl_aluguel, "Valor de aluguel");
  validarPreco(vl_vitalicio, "Valor vitalício");

  return {
    nm_titulo: parseString(formData.get("nm_titulo")) ?? "",
    nm_categoria: parseString(formData.get("nm_categoria")) ?? "Geral",
    tp_formato: (parseString(formData.get("tp_formato")) ?? "FILME") as TpFormato,
    nm_idioma: parseString(formData.get("nm_idioma")),
    ds_generos: parseString(formData.get("ds_generos")),
    ds_descricao: parseString(formData.get("ds_descricao")),
    vl_aluguel,
    vl_vitalicio,
    ds_url_poster: parseString(formData.get("ds_url_poster")),
    ds_url_bunny,
    ds_file_id_telegram,
    tp_fonte_prioritaria: (parseString(formData.get("tp_fonte_prioritaria")) ?? "LOCAL") as TpFontePrioritaria,
    sn_destaque: formData.get("sn_destaque") === "on" || formData.get("sn_destaque") === "true",
    dt_lancamento: parseString(formData.get("dt_lancamento")),
  };
}

export async function enviarPosterConteudo(cdConteudo: string, formData: FormData) {
  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    throw new Error("Nenhuma imagem enviada.");
  }
  return enviarPoster(arquivo, cdConteudo);
}

export async function adicionarConteudo(cdConteudo: string, formData: FormData) {
  const supabase = createSupabaseAdminClient();
  const campos = extrairCampos(formData);

  const { error } = await supabase.from("CONTEUDOS").insert({
    cd_conteudo: cdConteudo,
    ...campos,
    nr_views: 0,
  });

  if (error) throw new Error(error.message);

  await registrarLog({
    tp_acao: "CRIACAO",
    nm_entidade: "CONTEUDOS",
    cd_entidade: cdConteudo,
    ds_detalhes: { titulo: campos.nm_titulo },
  });

  revalidatePath("/admin/catalogo");
  revalidatePath("/");
}

export async function editarConteudo(id: string, formData: FormData) {
  const supabase = createSupabaseAdminClient();
  const campos = extrairCampos(formData);

  const { error } = await supabase.from("CONTEUDOS").update(campos).eq("cd_conteudo", id);

  if (error) throw new Error(error.message);

  await registrarLog({
    tp_acao: "EDICAO",
    nm_entidade: "CONTEUDOS",
    cd_entidade: id,
    ds_detalhes: { titulo: campos.nm_titulo },
  });

  revalidatePath("/admin/catalogo");
  revalidatePath("/");
}

async function removerConteudosPorId(supabase: ReturnType<typeof createSupabaseAdminClient>, ids: string[]) {
  const { data: registros } = await supabase.from("CONTEUDOS").select("*").in("cd_conteudo", ids);

  const { error } = await supabase.from("CONTEUDOS").delete().in("cd_conteudo", ids);
  if (error) throw new Error(error.message);

  for (const registro of (registros ?? []) as Conteudo[]) {
    await registrarLog({
      tp_acao: "EXCLUSAO",
      nm_entidade: "CONTEUDOS",
      cd_entidade: registro.cd_conteudo,
      ds_detalhes: { ...registro },
    });
  }

  revalidatePath("/admin/catalogo");
  revalidatePath("/");
}

export async function removerConteudo(id: string) {
  const supabase = createSupabaseAdminClient();
  await removerConteudosPorId(supabase, [id]);
}

export async function removerConteudosEmLote(ids: string[]) {
  if (ids.length === 0) return;
  const supabase = createSupabaseAdminClient();
  await removerConteudosPorId(supabase, ids);
}

export async function toggleDestaque(id: string, valor: boolean) {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("CONTEUDOS")
    .update({ sn_destaque: valor })
    .eq("cd_conteudo", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/catalogo");
  revalidatePath("/");
}

export async function toggleDestaqueEmLote(ids: string[], valor: boolean) {
  if (ids.length === 0) return;
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("CONTEUDOS")
    .update({ sn_destaque: valor })
    .in("cd_conteudo", ids);

  if (error) throw new Error(error.message);

  await registrarLog({
    tp_acao: "EDICAO",
    nm_entidade: "CONTEUDOS",
    ds_detalhes: { acao_lote: valor ? "destacar" : "remover_destaque", ids },
  });

  revalidatePath("/admin/catalogo");
  revalidatePath("/");
}

/** Restaura um conteúdo excluído a partir do snapshot salvo no log de auditoria. */
export async function restaurarConteudo(snapshot: Conteudo) {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("CONTEUDOS").insert(snapshot);
  if (error) throw new Error(error.message);

  await registrarLog({
    tp_acao: "RESTAURACAO",
    nm_entidade: "CONTEUDOS",
    cd_entidade: snapshot.cd_conteudo,
    ds_detalhes: { titulo: snapshot.nm_titulo },
  });

  revalidatePath("/admin/catalogo");
  revalidatePath("/admin/auditoria");
  revalidatePath("/");
}

export interface FiltroCatalogo {
  busca?: string;
  categoria?: string;
  formato?: TpFormato;
  ordenarPor?: "nm_titulo" | "nr_views" | "vl_aluguel" | "dt_lancamento";
  direcao?: "asc" | "desc";
}

/** Exporta todo o catálogo filtrado (sem limite de página) como CSV. */
export async function exportarCatalogoCsv(filtro: FiltroCatalogo): Promise<string> {
  const supabase = createSupabaseAdminClient();

  let query = supabase.from("CONTEUDOS").select("*");
  if (filtro.busca) query = query.ilike("nm_titulo", `%${filtro.busca}%`);
  if (filtro.categoria) query = query.eq("nm_categoria", filtro.categoria);
  if (filtro.formato) query = query.eq("tp_formato", filtro.formato);
  query = query.order(filtro.ordenarPor ?? "nm_titulo", {
    ascending: (filtro.direcao ?? "asc") === "asc",
  });

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const { paraCsv } = await import("@/lib/csv");
  return paraCsv((data ?? []) as Conteudo[], [
    { chave: "nm_titulo", rotulo: "Título" },
    { chave: "nm_categoria", rotulo: "Categoria" },
    { chave: "tp_formato", rotulo: "Formato" },
    { chave: "vl_aluguel", rotulo: "Valor Aluguel" },
    { chave: "vl_vitalicio", rotulo: "Valor Vitalício" },
    { chave: "sn_destaque", rotulo: "Destaque" },
    { chave: "nr_views", rotulo: "Views" },
    { chave: "dt_lancamento", rotulo: "Lançamento" },
  ]);
}
