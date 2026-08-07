import "server-only";
import { pool } from "./db";

export type AppNavegacao = {
  cd_app: string;
  nm_app: string;
  ds_icone: string;
  nr_ordem: number;
  sn_visivel: boolean;
};

export async function obterAppsVisiveis(): Promise<AppNavegacao[]> {
  const { rows } = await pool.query<AppNavegacao>(
    'SELECT * FROM "APPS_NAVEGACAO" WHERE sn_visivel = true ORDER BY nr_ordem ASC, nm_app ASC'
  );
  return rows;
}

export async function obterTodosApps(): Promise<AppNavegacao[]> {
  const { rows } = await pool.query<AppNavegacao>(
    'SELECT * FROM "APPS_NAVEGACAO" ORDER BY nr_ordem ASC, nm_app ASC'
  );
  return rows;
}
