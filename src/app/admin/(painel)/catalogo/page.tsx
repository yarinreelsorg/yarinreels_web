import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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
    : "nm_titulo";
  const direcao = params.dir === "desc" ? "desc" : "asc";
  const pagina = Math.max(1, Number(params.page) || 1);

  const supabase = createSupabaseAdminClient();

  let query = supabase.from("CONTEUDOS").select("*", { count: "exact" });
  if (busca) query = query.ilike("nm_titulo", `%${busca}%`);
  if (categoria) query = query.eq("nm_categoria", categoria);
  if (formato) query = query.eq("tp_formato", formato);
  query = query
    .order(ordenarPor, { ascending: direcao === "asc" })
    .range((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA - 1);

  const [{ data: conteudosData, count }, { data: rankingData }, { data: categoriasData }] =
    await Promise.all([
      query,
      supabase.from("vw_ranking_mensal").select("*"),
      supabase.from("CONTEUDOS").select("nm_categoria"),
    ]);

  const conteudos: Conteudo[] = conteudosData ?? [];
  const totalRegistros = count ?? 0;
  const categorias = Array.from(
    new Set((categoriasData ?? []).map((c) => c.nm_categoria).filter(Boolean))
  ).sort();

  const vendasMensais: Record<string, number> = {};
  for (const r of rankingData ?? []) {
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
