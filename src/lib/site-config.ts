import "server-only";
import { pool } from "./db";

export const LOGO_PADRAO = "/icon.svg";

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
