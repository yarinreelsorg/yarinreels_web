import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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

  const supabase = createSupabaseAdminClient();

  const [{ data: tentativasData, count }, { data: conteudosData }, { data: planosData }] =
    await Promise.all([
      supabase
        .from("TENTATIVAS_CARTAO_RECUSADAS")
        .select("*", { count: "exact" })
        .order("ts_criacao", { ascending: false })
        .range((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA - 1),
      supabase.from("CONTEUDOS").select("*"),
      supabase.from("PLANOS").select("*"),
    ]);

  const tentativas: TentativaCartaoRecusada[] = tentativasData ?? [];
  const conteudos: Conteudo[] = conteudosData ?? [];
  const planos: Plano[] = planosData ?? [];

  return (
    <RecusadosClient
      tentativas={tentativas}
      conteudos={conteudos}
      planos={planos}
      totalRegistros={count ?? 0}
      itensPorPagina={ITENS_POR_PAGINA}
      pagina={pagina}
    />
  );
}
