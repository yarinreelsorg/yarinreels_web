import { pool } from "@/lib/db";
import CatalogoAdminClient from "./CatalogoAdminClient";
import type { Conteudo, TpFormato } from "@/types/database";

export const revalidate = 0;

const ITENS_POR_PAGINA = 15;
const CAMPOS_ORDENACAO = ["nm_titulo", "nr_views", "vl_aluguel", "dt_lancamento"] as const;
type CampoOrdenacao = (typeof CAMPOS_ORDENACAO)[number];

export default async function CatalogoAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const busca = typeof params.busca === "string" ? params.busca : "";
  const categoria = typeof params.categoria === "string" ? params.categoria : "";
  const formato = typeof params.formato === "string" ? (params.formato as TpFormato) : "";
  const ordenarPor = CAMPOS_ORDENACAO.includes(params.sort as CampoOrdenacao)
    ? (params.sort as CampoOrdenacao)
    : "dt_lancamento";
  const direcao = typeof params.dir === "string" ? (params.dir === "asc" ? "asc" : "desc") : "desc";
  const pagina = Math.max(1, Number(params.page) || 1);

  const condicoes: string[] = [];
  const valores: unknown[] = [];
  if (busca) {
    valores.push(`%${busca}%`);
    condicoes.push(`nm_titulo ILIKE $${valores.length}`);
  }
  if (categoria) {
    valores.push(categoria);
    condicoes.push(`nm_categoria = $${valores.length}`);
  }
  if (formato) {
    valores.push(formato);
    condicoes.push(`tp_formato = $${valores.length}`);
  }
  const whereSql = condicoes.length > 0 ? `WHERE ${condicoes.join(" AND ")}` : "";
  const direcaoSql = direcao === "asc" ? "ASC" : "DESC";

  valores.push(ITENS_POR_PAGINA, (pagina - 1) * ITENS_POR_PAGINA);
  const limitParam = valores.length - 1;
  const offsetParam = valores.length;

  const [conteudosResult, rankingResult, categoriasResult] = await Promise.all([
    pool.query<Conteudo & { total_count: string }>(
      `SELECT *, COUNT(*) OVER() AS total_count FROM "CONTEUDOS" ${whereSql}
       ORDER BY ${ordenarPor} ${direcaoSql} LIMIT $${limitParam} OFFSET $${offsetParam}`,
      valores
    ),
    pool.query<{ cd_conteudo: string; total_vendas: number }>("SELECT * FROM vw_ranking_mensal"),
    pool.query<{ nm_categoria: string }>('SELECT nm_categoria FROM "CONTEUDOS"'),
  ]);

  const conteudos: Conteudo[] = conteudosResult.rows;
  const totalRegistros = Number(conteudosResult.rows[0]?.total_count ?? 0);
  const categorias = Array.from(
    new Set(categoriasResult.rows.map((c) => c.nm_categoria).filter(Boolean))
  ).sort();

  const vendasMensais: Record<string, number> = {};
  for (const r of rankingResult.rows) {
    vendasMensais[String(r.cd_conteudo)] = r.total_vendas;
  }

  return (
    <CatalogoAdminClient
      conteudos={conteudos}
      vendasMensais={vendasMensais}
      categoriasDisponiveis={categorias}
      totalRegistros={totalRegistros}
      itensPorPagina={ITENS_POR_PAGINA}
      filtrosAtuais={{ busca, categoria, formato, ordenarPor, direcao, pagina }}
    />
  );
}
