import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Conteudo, Plano, Venda } from "@/types/database";
import PlanosAdminClient from "./PlanosAdminClient";

export const revalidate = 0;

export default async function PlanosAdminPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: planosData }, { data: conteudosData }, { data: vendasData }] =
    await Promise.all([
      supabase.from("PLANOS").select("*").order("nm_plano", { ascending: true }),
      supabase.from("CONTEUDOS").select("*"),
      supabase.from("VENDAS").select("cd_plano, tp_status, ts_expiracao").eq("tp_compra", "ASSINATURA"),
    ]);

  const planos: Plano[] = planosData ?? [];
  const conteudos: Conteudo[] = conteudosData ?? [];
  const vendas = (vendasData ?? []) as Pick<Venda, "cd_plano" | "tp_status" | "ts_expiracao">[];

  const categorias = Array.from(
    new Set(conteudos.map((c) => c.nm_categoria).filter(Boolean))
  ).sort();

  const agoraIso = new Date().toISOString();
  const assinantesPorPlano: Record<string, number> = {};
  for (const v of vendas) {
    if (!v.cd_plano) continue;
    if (v.tp_status !== "APROVADA") continue;
    if (!v.ts_expiracao || v.ts_expiracao <= agoraIso) continue;
    assinantesPorPlano[v.cd_plano] = (assinantesPorPlano[v.cd_plano] ?? 0) + 1;
  }

  return (
    <PlanosAdminClient
      planosInicial={planos}
      categorias={categorias}
      assinantesPorPlano={assinantesPorPlano}
    />
  );
}
