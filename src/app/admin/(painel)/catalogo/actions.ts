"use server";

import { pool } from "@/lib/db";
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
  const ds_url_bunny_legendado = parseString(formData.get("ds_url_bunny_legendado"));
  const ds_file_id_telegram_legendado = parseString(formData.get("ds_file_id_telegram_legendado"));
  const ds_url_teaser_vertical = parseString(formData.get("ds_url_teaser_vertical"));
  const segundosPreview = parseNumber(formData.get("nr_segundos_preview_trailer"));
  const nr_segundos_preview_trailer =
    segundosPreview && segundosPreview > 0 ? Math.round(segundosPreview) : 60;
  const tp_fonte_prioritaria = (parseString(formData.get("tp_fonte_prioritaria")) ??
    "LOCAL") as TpFontePrioritaria;
  const vl_aluguel = parseNumber(formData.get("vl_aluguel"));
  const vl_vitalicio = parseNumber(formData.get("vl_vitalicio"));

  validarUrlBunny(ds_url_bunny);
  validarUrlBunny(ds_url_bunny_legendado);
  validarUrlBunny(ds_url_teaser_vertical);
  // Esse campo só precisa ser um file_id de verdade quando a fonte é
  // TELEGRAM — quando a fonte é LOCAL, ele guarda o nome do arquivo local
  // (com espaços, acentos, ".mp4" etc), que a regex de file_id rejeitava,
  // quebrando o salvamento de QUALQUER edição em conteúdo LOCAL.
  if (tp_fonte_prioritaria === "TELEGRAM") {
    validarTelegramFileId(ds_file_id_telegram);
    validarTelegramFileId(ds_file_id_telegram_legendado);
  }
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
    ds_url_bunny_legendado,
    ds_file_id_telegram_legendado,
    ds_url_teaser_vertical,
    nr_segundos_preview_trailer,
    tp_fonte_prioritaria,
    sn_destaque: formData.get("sn_destaque") === "on" || formData.get("sn_destaque") === "true",
    dt_lancamento: parseString(formData.get("dt_lancamento")),
    nm_app_origem: parseString(formData.get("nm_app_origem")),
    sn_exclusivo_assinantes:
      formData.get("sn_exclusivo_assinantes") === "on" ||
      formData.get("sn_exclusivo_assinantes") === "true",
    sn_carencia_ativa:
      formData.get("sn_carencia_ativa") === "on" || formData.get("sn_carencia_ativa") === "true",
  };
}

export async function adicionarConteudo(cdConteudo: string, formData: FormData) {
  const campos = extrairCampos(formData);

  await pool.query(
    `INSERT INTO "CONTEUDOS"
       (cd_conteudo, nm_titulo, nm_categoria, tp_formato, nm_idioma, ds_generos, ds_descricao,
        vl_aluguel, vl_vitalicio, ds_url_poster, ds_url_bunny, ds_file_id_telegram,
        ds_url_bunny_legendado, ds_file_id_telegram_legendado, ds_url_teaser_vertical,
        nr_segundos_preview_trailer, tp_fonte_prioritaria, sn_destaque, dt_lancamento,
        nm_app_origem, sn_exclusivo_assinantes, sn_carencia_ativa, nr_views)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,0)`,
    [
      cdConteudo,
      campos.nm_titulo,
      campos.nm_categoria,
      campos.tp_formato,
      campos.nm_idioma,
      campos.ds_generos,
      campos.ds_descricao,
      campos.vl_aluguel,
      campos.vl_vitalicio,
      campos.ds_url_poster,
      campos.ds_url_bunny,
      campos.ds_file_id_telegram,
      campos.ds_url_bunny_legendado,
      campos.ds_file_id_telegram_legendado,
      campos.ds_url_teaser_vertical,
      campos.nr_segundos_preview_trailer,
      campos.tp_fonte_prioritaria,
      campos.sn_destaque,
      campos.dt_lancamento,
      campos.nm_app_origem,
      campos.sn_exclusivo_assinantes,
      campos.sn_carencia_ativa,
    ]
  );

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
  const campos = extrairCampos(formData);

  await pool.query(
    `UPDATE "CONTEUDOS" SET
       nm_titulo = $1, nm_categoria = $2, tp_formato = $3, nm_idioma = $4, ds_generos = $5,
       ds_descricao = $6, vl_aluguel = $7, vl_vitalicio = $8, ds_url_poster = $9,
       ds_url_bunny = $10, ds_file_id_telegram = $11, ds_url_bunny_legendado = $12,
       ds_file_id_telegram_legendado = $13, ds_url_teaser_vertical = $14,
       nr_segundos_preview_trailer = $15, tp_fonte_prioritaria = $16,
       sn_destaque = $17, dt_lancamento = $18, nm_app_origem = $19, sn_exclusivo_assinantes = $20,
       sn_carencia_ativa = $21
     WHERE cd_conteudo = $22`,
    [
      campos.nm_titulo,
      campos.nm_categoria,
      campos.tp_formato,
      campos.nm_idioma,
      campos.ds_generos,
      campos.ds_descricao,
      campos.vl_aluguel,
      campos.vl_vitalicio,
      campos.ds_url_poster,
      campos.ds_url_bunny,
      campos.ds_file_id_telegram,
      campos.ds_url_bunny_legendado,
      campos.ds_file_id_telegram_legendado,
      campos.ds_url_teaser_vertical,
      campos.nr_segundos_preview_trailer,
      campos.tp_fonte_prioritaria,
      campos.sn_destaque,
      campos.dt_lancamento,
      campos.nm_app_origem,
      campos.sn_exclusivo_assinantes,
      campos.sn_carencia_ativa,
      id,
    ]
  );

  await registrarLog({
    tp_acao: "EDICAO",
    nm_entidade: "CONTEUDOS",
    cd_entidade: id,
    ds_detalhes: { titulo: campos.nm_titulo },
  });

  revalidatePath("/admin/catalogo");
  revalidatePath("/");
}

async function removerConteudosPorId(ids: string[]) {
  const { rows: registros } = await pool.query<Conteudo>(
    'SELECT * FROM "CONTEUDOS" WHERE cd_conteudo = ANY($1::uuid[])',
    [ids]
  );

  await pool.query('DELETE FROM "CONTEUDOS" WHERE cd_conteudo = ANY($1::uuid[])', [ids]);

  for (const registro of registros) {
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
  await removerConteudosPorId([id]);
}

export async function removerConteudosEmLote(ids: string[]) {
  if (ids.length === 0) return;
  await removerConteudosPorId(ids);
}

export async function toggleDestaque(id: string, valor: boolean) {
  await pool.query('UPDATE "CONTEUDOS" SET sn_destaque = $1 WHERE cd_conteudo = $2', [valor, id]);

  revalidatePath("/admin/catalogo");
  revalidatePath("/");
}

export async function toggleDestaqueEmLote(ids: string[], valor: boolean) {
  if (ids.length === 0) return;

  await pool.query('UPDATE "CONTEUDOS" SET sn_destaque = $1 WHERE cd_conteudo = ANY($2::uuid[])', [
    valor,
    ids,
  ]);

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
  await pool.query(
    `INSERT INTO "CONTEUDOS"
       (cd_conteudo, nm_titulo, nm_categoria, tp_formato, dt_lancamento, nm_idioma, ds_descricao,
        ds_generos, ds_url_trailer_youtube, ds_url_teaser_vertical, nr_duracao_minutos, vl_aluguel,
        vl_vitalicio, ds_url_poster, ds_file_id_telegram, ds_url_bunny, tp_fonte_prioritaria,
        sn_destaque, nr_views)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
    [
      snapshot.cd_conteudo,
      snapshot.nm_titulo,
      snapshot.nm_categoria,
      snapshot.tp_formato,
      snapshot.dt_lancamento,
      snapshot.nm_idioma,
      snapshot.ds_descricao,
      snapshot.ds_generos,
      snapshot.ds_url_trailer_youtube,
      snapshot.ds_url_teaser_vertical,
      snapshot.nr_duracao_minutos,
      snapshot.vl_aluguel,
      snapshot.vl_vitalicio,
      snapshot.ds_url_poster,
      snapshot.ds_file_id_telegram,
      snapshot.ds_url_bunny,
      snapshot.tp_fonte_prioritaria,
      snapshot.sn_destaque,
      snapshot.nr_views,
    ]
  );

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

const COLUNAS_ORDENACAO = ["nm_titulo", "nr_views", "vl_aluguel", "dt_lancamento"] as const;

/** Exporta todo o catálogo filtrado (sem limite de página) como CSV. */
export async function exportarCatalogoCsv(filtro: FiltroCatalogo): Promise<string> {
  const condicoes: string[] = [];
  const valores: unknown[] = [];

  if (filtro.busca) {
    valores.push(`%${filtro.busca}%`);
    condicoes.push(`nm_titulo ILIKE $${valores.length}`);
  }
  if (filtro.categoria) {
    valores.push(filtro.categoria);
    condicoes.push(`nm_categoria = $${valores.length}`);
  }
  if (filtro.formato) {
    valores.push(filtro.formato);
    condicoes.push(`tp_formato = $${valores.length}`);
  }

  const coluna = COLUNAS_ORDENACAO.includes(filtro.ordenarPor as (typeof COLUNAS_ORDENACAO)[number])
    ? filtro.ordenarPor
    : "nm_titulo";
  const direcao = filtro.direcao === "desc" ? "DESC" : "ASC";
  const whereSql = condicoes.length > 0 ? `WHERE ${condicoes.join(" AND ")}` : "";

  const { rows } = await pool.query<Conteudo>(
    `SELECT * FROM "CONTEUDOS" ${whereSql} ORDER BY ${coluna} ${direcao}`,
    valores
  );

  const { paraCsv } = await import("@/lib/csv");
  return paraCsv(rows, [
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
