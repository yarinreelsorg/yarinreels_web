"use server";

import { pool } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type SolicitacaoAgrupada = {
  chave: string;
  ds_titulo: string;
  total: number;
  ultima_solicitacao: string;
};

export async function listarSolicitacoesAgrupadas(): Promise<SolicitacaoAgrupada[]> {
  const { rows } = await pool.query<{
    chave: string;
    ds_titulo: string;
    total: string;
    ultima_solicitacao: string;
  }>(
    `SELECT lower(trim(ds_titulo)) AS chave,
            (array_agg(ds_titulo ORDER BY ts_criacao))[1] AS ds_titulo,
            COUNT(*) AS total,
            MAX(ts_criacao) AS ultima_solicitacao
     FROM "SOLICITACOES_DRAMA"
     GROUP BY chave
     ORDER BY total DESC, ultima_solicitacao DESC`
  );

  return rows.map((r) => ({ ...r, total: Number(r.total) }));
}

/** Remove todos os pedidos daquele título — usado quando o drama já foi
 * trazido pro catálogo (ou quando o pedido era spam/duplicata de grafia). */
export async function excluirSolicitacao(chave: string) {
  await pool.query(
    `DELETE FROM "SOLICITACOES_DRAMA" WHERE lower(trim(ds_titulo)) = $1`,
    [chave]
  );
  revalidatePath("/admin/solicitacoes");
}
