import { pool } from "@/lib/db";
import ClientesAdminClient from "./ClientesAdminClient";
import type { ClienteResumo, Conteudo, Plano } from "@/types/database";

export const revalidate = 0;

const ITENS_POR_PAGINA = 15;
const CAMPOS_ORDENACAO = ["nr_id_telegram", "total_compras", "ultima_compra"] as const;
type CampoOrdenacao = (typeof CAMPOS_ORDENACAO)[number];

export default async function ClientesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const busca = typeof params.busca === "string" ? params.busca : "";
  const ordenarPor = CAMPOS_ORDENACAO.includes(params.sort as CampoOrdenacao)
    ? (params.sort as CampoOrdenacao)
    : "ultima_compra";
  const direcao = params.dir === "asc" ? "asc" : "desc";
  const pagina = Math.max(1, Number(params.page) || 1);

  const valores: unknown[] = [];
  const whereSql = busca
    ? (() => {
        valores.push(`%${busca}%`);
        return `WHERE id_telegram_texto ILIKE $${valores.length}`;
      })()
    : "";
  const direcaoSql = direcao === "asc" ? "ASC" : "DESC";

  valores.push(ITENS_POR_PAGINA, (pagina - 1) * ITENS_POR_PAGINA);
  const limitParam = valores.length - 1;
  const offsetParam = valores.length;

  const [clientesResult, conteudosResult, planosResult] = await Promise.all([
    pool.query<ClienteResumo & { total_count: string }>(
      `SELECT *, COUNT(*) OVER() AS total_count FROM vw_clientes ${whereSql}
       ORDER BY ${ordenarPor} ${direcaoSql} LIMIT $${limitParam} OFFSET $${offsetParam}`,
      valores
    ),
    pool.query<Conteudo>('SELECT * FROM "CONTEUDOS"'),
    pool.query<Plano>('SELECT * FROM "PLANOS"'),
  ]);

  const clientes: ClienteResumo[] = clientesResult.rows;
  const totalRegistros = Number(clientesResult.rows[0]?.total_count ?? 0);

  return (
    <ClientesAdminClient
      clientes={clientes}
      totalRegistros={totalRegistros}
      itensPorPagina={ITENS_POR_PAGINA}
      filtrosAtuais={{ busca, ordenarPor, direcao, pagina }}
      conteudos={conteudosResult.rows}
      planos={planosResult.rows}
    />
  );
}
