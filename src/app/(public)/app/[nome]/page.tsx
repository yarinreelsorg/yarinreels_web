import { notFound } from "next/navigation";
import { pool } from "@/lib/db";
import type { Conteudo } from "@/types/database";
import AppPage from "./AppPage";

export default async function AppRoute({
  params,
}: {
  params: Promise<{ nome: string }>;
}) {
  const { nome: nomeParam } = await params;
  let nome = nomeParam;
  try {
    nome = decodeURIComponent(nomeParam);
  } catch {
    // já decodificado ou malformado — usa como veio
  }

  const { rows: appRows } = await pool.query<{ nm_app: string; ds_icone: string }>(
    'SELECT nm_app, ds_icone FROM "APPS_NAVEGACAO" WHERE LOWER(nm_app) = LOWER($1) AND sn_visivel = true LIMIT 1',
    [nome]
  );
  const app = appRows[0];

  if (!app) notFound();

  // Um título pode pertencer a mais de um app de origem (nm_apps_origem) —
  // além do campo legado singular nm_app_origem, que o bot ainda só conhece.
  const { rows: conteudos } = await pool.query<Conteudo>(
    `SELECT * FROM "CONTEUDOS"
     WHERE LOWER(nm_app_origem) = LOWER($1)
        OR EXISTS (SELECT 1 FROM unnest(nm_apps_origem) a WHERE LOWER(a) = LOWER($1))
     ORDER BY dt_lancamento DESC NULLS LAST`,
    [app.nm_app]
  );

  return <AppPage nmApp={app.nm_app} dsIcone={app.ds_icone} conteudos={conteudos} />;
}
