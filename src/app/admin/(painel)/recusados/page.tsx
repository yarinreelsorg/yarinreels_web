import { pool } from "@/lib/db";
import RecusadosClient from "./RecusadosClient";
import type { Conteudo, Plano, TentativaCartaoRecusada } from "@/types/database";

export const revalidate = 0;

const ITENS_POR_PAGINA = 25;

export default async function RecusadosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const pagina = Math.max(1, Number(params.page) || 1);

  const [tentativasResult, conteudosResult, planosResult] = await Promise.all([
    pool.query<TentativaCartaoRecusada & { total_count: string }>(
      `SELECT *, COUNT(*) OVER() AS total_count FROM "TENTATIVAS_CARTAO_RECUSADAS"
       ORDER BY ts_criacao DESC LIMIT $1 OFFSET $2`,
      [ITENS_POR_PAGINA, (pagina - 1) * ITENS_POR_PAGINA]
    ),
    pool.query<Conteudo>('SELECT * FROM "CONTEUDOS"'),
    pool.query<Plano>('SELECT * FROM "PLANOS"'),
  ]);

  const tentativas: TentativaCartaoRecusada[] = tentativasResult.rows;
  const totalRegistros = Number(tentativasResult.rows[0]?.total_count ?? 0);

  return (
    <RecusadosClient
      tentativas={tentativas}
      conteudos={conteudosResult.rows}
      planos={planosResult.rows}
      totalRegistros={totalRegistros}
      itensPorPagina={ITENS_POR_PAGINA}
      pagina={pagina}
    />
  );
}
