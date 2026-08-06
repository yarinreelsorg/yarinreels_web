import "server-only";
import { pool } from "./db";

/** Taxa fixa adicional cobrada em pagamentos com cartão (config. pelo admin). */
export async function obterTaxaCartao(): Promise<number> {
  const { rows } = await pool.query<{ vl_taxa_cartao: number }>(
    'SELECT vl_taxa_cartao FROM "CONFIGURACAO_PAGAMENTO" LIMIT 1'
  );
  return rows[0]?.vl_taxa_cartao ?? 0;
}

/** Nome exato do plano usado no banner "Primeiro mês por R$ 20" da home. */
const NOME_PLANO_PROMO_INICIAL = "Primeiro Mês - Promoção R$20";

/** ID do plano promocional pra linkar o banner direto no checkout dele. */
export async function obterCdPlanoPromoInicial(): Promise<string | null> {
  const { rows } = await pool.query<{ cd_plano: string }>(
    'SELECT cd_plano FROM "PLANOS" WHERE nm_plano = $1 LIMIT 1',
    [NOME_PLANO_PROMO_INICIAL]
  );
  return rows[0]?.cd_plano ?? null;
}
