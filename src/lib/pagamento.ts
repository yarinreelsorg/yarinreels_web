import "server-only";
import { pool } from "./db";

/** Taxa fixa adicional cobrada em pagamentos com cartão (config. pelo admin). */
export async function obterTaxaCartao(): Promise<number> {
  const { rows } = await pool.query<{ vl_taxa_cartao: number }>(
    'SELECT vl_taxa_cartao FROM "CONFIGURACAO_PAGAMENTO" LIMIT 1'
  );
  return rows[0]?.vl_taxa_cartao ?? 0;
}

