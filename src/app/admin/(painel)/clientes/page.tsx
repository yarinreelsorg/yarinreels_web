import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import ClientesAdminClient from "./ClientesAdminClient";
import type { ClienteResumo } from "@/types/database";

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

  const supabase = createSupabaseAdminClient();

  let query = supabase.from("vw_clientes").select("*", { count: "exact" });
  if (busca) query = query.ilike("id_telegram_texto", `%${busca}%`);
  query = query
    .order(ordenarPor, { ascending: direcao === "asc" })
    .range((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA - 1);

  const [{ data: clientesData, count }, { data: conteudosData }, { data: planosData }] =
    await Promise.all([
      query,
      supabase.from("CONTEUDOS").select("*"),
      supabase.from("PLANOS").select("*"),
    ]);

  const clientes: ClienteResumo[] = clientesData ?? [];

  return (
    <ClientesAdminClient
      clientes={clientes}
      totalRegistros={count ?? 0}
      itensPorPagina={ITENS_POR_PAGINA}
      filtrosAtuais={{ busca, ordenarPor, direcao, pagina }}
      conteudos={conteudosData ?? []}
      planos={planosData ?? []}
    />
  );
}
