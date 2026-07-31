import { pool } from "@/lib/db";
import type { Conteudo, Plano, Venda } from "@/types/database";
import PlanosAdminClient from "./PlanosAdminClient";

export const revalidate = 0;

export default async function PlanosAdminPage() {
  const [{ rows: planos }, { rows: conteudos }, { rows: vendas }] = await Promise.all([
    pool.query<Plano>('SELECT * FROM "PLANOS" ORDER BY nm_plano ASC'),
    pool.query<Conteudo>('SELECT * FROM "CONTEUDOS"'),
    pool.query<Pick<Venda, "cd_plano" | "tp_status" | "ts_expiracao">>(
      `SELECT cd_plano, tp_status, ts_expiracao FROM "VENDAS" WHERE tp_compra = 'ASSINATURA'`
    ),
  ]);

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
