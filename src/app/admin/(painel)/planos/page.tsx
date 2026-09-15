import { pool } from "@/lib/db";
import { canonicalizarCategorias } from "@/lib/categorias-config";
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

  const nomesCategorias = conteudos.map((c) => c.nm_categoria).filter(Boolean);
  const canonPorNomeCategoria = canonicalizarCategorias(nomesCategorias);
  const categorias = Array.from(
    new Set(nomesCategorias.map((c) => canonPorNomeCategoria.get(c) ?? c))
  ).sort();

  const agora = new Date();
  const assinantesPorPlano: Record<string, number> = {};
  for (const v of vendas) {
    if (!v.cd_plano) continue;
    if (v.tp_status !== "APROVADA") continue;
    // ts_expiracao vem do driver `pg` como objeto Date, não string — apesar
    // do tipo TS dizer `string`. Comparar direto com uma string ISO
    // (`v.ts_expiracao <= agoraIso`) nunca dá certo em JS: o Date usa
    // toString() na comparação, não o formato ISO, então a checagem de
    // "já expirou" nunca batia e contava assinante expirado como ativo.
    if (!v.ts_expiracao || new Date(v.ts_expiracao).getTime() <= agora.getTime()) continue;
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
