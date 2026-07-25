"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { registrarLog } from "@/lib/auditoria";
import { revalidatePath } from "next/cache";
import type { Episodio } from "@/types/database";

export async function listarEpisodios(cdConteudo: string): Promise<Episodio[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("EPISODIOS")
    .select("*")
    .eq("cd_conteudo", cdConteudo)
    .order("nr_episodio", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

function parseString(val: unknown) {
  if (val === null || val === undefined || val === "") return null;
  return String(val);
}

export async function adicionarEpisodio(cdConteudo: string, formData: FormData) {
  const nr_episodio = Number(formData.get("nr_episodio"));
  const nm_titulo = String(formData.get("nm_titulo") ?? "").trim();

  if (!nm_titulo) throw new Error("Informe o título do episódio.");
  if (!nr_episodio || nr_episodio < 1) throw new Error("Informe um número de episódio válido.");

  const supabase = createSupabaseAdminClient();
  const cd_episodio = crypto.randomUUID();

  const { error } = await supabase.from("EPISODIOS").insert({
    cd_episodio,
    cd_conteudo: cdConteudo,
    nr_episodio,
    nm_titulo,
    ds_url_bunny: parseString(formData.get("ds_url_bunny")),
    ds_file_id_telegram: parseString(formData.get("ds_file_id_telegram")),
  });

  if (error) throw new Error(error.message);

  await registrarLog({
    tp_acao: "CRIACAO",
    nm_entidade: "EPISODIOS",
    cd_entidade: cd_episodio,
    ds_detalhes: { cd_conteudo: cdConteudo, nr_episodio, nm_titulo },
  });

  revalidatePath("/admin/catalogo");
  revalidatePath(`/assistir/${cdConteudo}`);
}

export async function editarEpisodio(cdEpisodio: string, formData: FormData) {
  const nr_episodio = Number(formData.get("nr_episodio"));
  const nm_titulo = String(formData.get("nm_titulo") ?? "").trim();

  if (!nm_titulo) throw new Error("Informe o título do episódio.");
  if (!nr_episodio || nr_episodio < 1) throw new Error("Informe um número de episódio válido.");

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("EPISODIOS")
    .update({
      nr_episodio,
      nm_titulo,
      ds_url_bunny: parseString(formData.get("ds_url_bunny")),
      ds_file_id_telegram: parseString(formData.get("ds_file_id_telegram")),
    })
    .eq("cd_episodio", cdEpisodio);

  if (error) throw new Error(error.message);

  await registrarLog({
    tp_acao: "EDICAO",
    nm_entidade: "EPISODIOS",
    cd_entidade: cdEpisodio,
    ds_detalhes: { nr_episodio, nm_titulo },
  });

  revalidatePath("/admin/catalogo");
}

export async function removerEpisodio(cdEpisodio: string, cdConteudo: string) {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("EPISODIOS").delete().eq("cd_episodio", cdEpisodio);
  if (error) throw new Error(error.message);

  await registrarLog({
    tp_acao: "EXCLUSAO",
    nm_entidade: "EPISODIOS",
    cd_entidade: cdEpisodio,
  });

  revalidatePath("/admin/catalogo");
  revalidatePath(`/assistir/${cdConteudo}`);
}
