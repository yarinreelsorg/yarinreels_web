"use server";

import { pool } from "@/lib/db";
import { registrarLog } from "@/lib/auditoria";
import { revalidatePath } from "next/cache";
import type { Episodio } from "@/types/database";

export async function listarEpisodios(cdConteudo: string): Promise<Episodio[]> {
  const { rows } = await pool.query<Episodio>(
    'SELECT * FROM "EPISODIOS" WHERE cd_conteudo = $1 ORDER BY nr_episodio ASC',
    [cdConteudo]
  );
  return rows;
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

  const cd_episodio = crypto.randomUUID();

  await pool.query(
    `INSERT INTO "EPISODIOS"
       (cd_episodio, cd_conteudo, nr_episodio, nm_titulo, ds_url_bunny, ds_file_id_telegram,
        ds_url_bunny_legendado, ds_file_id_telegram_legendado)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      cd_episodio,
      cdConteudo,
      nr_episodio,
      nm_titulo,
      parseString(formData.get("ds_url_bunny")),
      parseString(formData.get("ds_file_id_telegram")),
      parseString(formData.get("ds_url_bunny_legendado")),
      parseString(formData.get("ds_file_id_telegram_legendado")),
    ]
  );

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

  await pool.query(
    `UPDATE "EPISODIOS" SET nr_episodio = $1, nm_titulo = $2, ds_url_bunny = $3, ds_file_id_telegram = $4,
       ds_url_bunny_legendado = $5, ds_file_id_telegram_legendado = $6
     WHERE cd_episodio = $7`,
    [
      nr_episodio,
      nm_titulo,
      parseString(formData.get("ds_url_bunny")),
      parseString(formData.get("ds_file_id_telegram")),
      parseString(formData.get("ds_url_bunny_legendado")),
      parseString(formData.get("ds_file_id_telegram_legendado")),
      cdEpisodio,
    ]
  );

  await registrarLog({
    tp_acao: "EDICAO",
    nm_entidade: "EPISODIOS",
    cd_entidade: cdEpisodio,
    ds_detalhes: { nr_episodio, nm_titulo },
  });

  revalidatePath("/admin/catalogo");
}

export async function removerEpisodio(cdEpisodio: string, cdConteudo: string) {
  await pool.query('DELETE FROM "EPISODIOS" WHERE cd_episodio = $1', [cdEpisodio]);

  await registrarLog({
    tp_acao: "EXCLUSAO",
    nm_entidade: "EPISODIOS",
    cd_entidade: cdEpisodio,
  });

  revalidatePath("/admin/catalogo");
  revalidatePath(`/assistir/${cdConteudo}`);
}
