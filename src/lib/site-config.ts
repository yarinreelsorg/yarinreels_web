import "server-only";
import { pool } from "./db";

export const LOGO_PADRAO = "/icon.png";

export async function obterLogoSite(): Promise<string> {
  const { rows } = await pool.query<{ ds_logo_url: string | null }>(
    'SELECT ds_logo_url FROM "CONFIGURACAO_SITE" LIMIT 1'
  );
  return rows[0]?.ds_logo_url || LOGO_PADRAO;
}

export async function salvarLogoSite(url: string | null) {
  const { rows: existente } = await pool.query<{ cd_configuracao: string }>(
    'SELECT cd_configuracao FROM "CONFIGURACAO_SITE" LIMIT 1'
  );

  if (existente[0]) {
    await pool.query('UPDATE "CONFIGURACAO_SITE" SET ds_logo_url = $1 WHERE cd_configuracao = $2', [
      url,
      existente[0].cd_configuracao,
    ]);
  } else {
    await pool.query('INSERT INTO "CONFIGURACAO_SITE" (ds_logo_url) VALUES ($1)', [url]);
  }
}

/** Horas de carência: lançamento fica bloqueado pra quem só tem assinatura
 * (sem compra avulsa) por esse tempo desde dt_lancamento. 0 = desativado. */
export async function obterCarenciaAssinanteHoras(): Promise<number> {
  const { rows } = await pool.query<{ nr_horas_carencia_assinante: number }>(
    'SELECT nr_horas_carencia_assinante FROM "CONFIGURACAO_SITE" LIMIT 1'
  );
  return rows[0]?.nr_horas_carencia_assinante ?? 0;
}

export async function salvarCarenciaAssinanteHoras(horas: number) {
  const { rows: existente } = await pool.query<{ cd_configuracao: string }>(
    'SELECT cd_configuracao FROM "CONFIGURACAO_SITE" LIMIT 1'
  );

  if (existente[0]) {
    await pool.query(
      'UPDATE "CONFIGURACAO_SITE" SET nr_horas_carencia_assinante = $1 WHERE cd_configuracao = $2',
      [horas, existente[0].cd_configuracao]
    );
  } else {
    await pool.query('INSERT INTO "CONFIGURACAO_SITE" (nr_horas_carencia_assinante) VALUES ($1)', [
      horas,
    ]);
  }
}

/** Percentual de comissão do programa de indicação — ver src/lib/afiliados.ts. */
export async function obterPercentualAfiliado(): Promise<number> {
  const { rows } = await pool.query<{ vl_percentual_afiliado: number }>(
    'SELECT vl_percentual_afiliado FROM "CONFIGURACAO_SITE" LIMIT 1'
  );
  return rows[0]?.vl_percentual_afiliado ?? 10;
}

export async function salvarPercentualAfiliado(percentual: number) {
  const { rows: existente } = await pool.query<{ cd_configuracao: string }>(
    'SELECT cd_configuracao FROM "CONFIGURACAO_SITE" LIMIT 1'
  );

  if (existente[0]) {
    await pool.query(
      'UPDATE "CONFIGURACAO_SITE" SET vl_percentual_afiliado = $1 WHERE cd_configuracao = $2',
      [percentual, existente[0].cd_configuracao]
    );
  } else {
    await pool.query('INSERT INTO "CONFIGURACAO_SITE" (vl_percentual_afiliado) VALUES ($1)', [
      percentual,
    ]);
  }
}

export async function obterVideoSuporteSite(): Promise<string | null> {
  const { rows } = await pool.query<{ ds_url_video_suporte: string | null }>(
    'SELECT ds_url_video_suporte FROM "CONFIGURACAO_SITE" LIMIT 1'
  );
  return rows[0]?.ds_url_video_suporte ?? null;
}

export async function salvarVideoSuporteSite(url: string | null) {
  const { rows: existente } = await pool.query<{ cd_configuracao: string }>(
    'SELECT cd_configuracao FROM "CONFIGURACAO_SITE" LIMIT 1'
  );

  const urlLimpa = url && url.trim() ? url.trim() : null;

  if (existente[0]) {
    await pool.query(
      'UPDATE "CONFIGURACAO_SITE" SET ds_url_video_suporte = $1 WHERE cd_configuracao = $2',
      [urlLimpa, existente[0].cd_configuracao]
    );
  } else {
    await pool.query('INSERT INTO "CONFIGURACAO_SITE" (ds_url_video_suporte) VALUES ($1)', [
      urlLimpa,
    ]);
  }
}
