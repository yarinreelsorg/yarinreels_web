import { createSupabaseServerClient } from "@/lib/supabase/server";
import CatalogoAdminClient from "./CatalogoAdminClient";
import type { Conteudo } from "@/types/database";

export const revalidate = 0;

export default async function CatalogoAdminPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: conteudosData }, { data: rankingData }] = await Promise.all([
    supabase.from("CONTEUDOS").select("*").order("nm_titulo", { ascending: true }),
    supabase.from("vw_ranking_mensal").select("*"),
  ]);

  const conteudos: Conteudo[] = conteudosData ?? [];

  const vendasMensais: Record<string, number> = {};
  for (const r of rankingData ?? []) {
    vendasMensais[String(r.cd_conteudo)] = r.total_vendas;
  }

  return (
    <CatalogoAdminClient conteudosInicial={conteudos} vendasMensais={vendasMensais} />
  );
}
