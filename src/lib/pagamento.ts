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

/**
 * O banner "Primeiro mês por R$ 20" some pra sempre assim que o cliente
 * assina qualquer plano OU vincula o Telegram — nos dois casos ele já
 * tem uma identidade "gravada" no sistema, então a oferta de boas-vindas
 * deixou de fazer sentido. Não usa obterIdsTelegramElegiveis aqui de
 * propósito — essa função cria a identidade sintética na hora, e só
 * queremos LER o que já existe, sem gravar nada num simples carregamento
 * da home.
 */
export async function deveExibirPromoInicial(cdUsuario: string): Promise<boolean> {
  const { rows } = await pool.query<{
    nr_id_telegram: number | null;
    nr_id_telegram_web: number | null;
  }>('SELECT nr_id_telegram, nr_id_telegram_web FROM "USUARIOS" WHERE cd_usuario = $1 LIMIT 1', [
    cdUsuario,
  ]);
  const usuario = rows[0];
  if (!usuario) return true;
  if (usuario.nr_id_telegram) return false;

  const idsConhecidos = [usuario.nr_id_telegram, usuario.nr_id_telegram_web].filter(
    (id): id is number => !!id
  );
  if (idsConhecidos.length === 0) return true;

  const { rows: assinaturaRows } = await pool.query<{ total: string }>(
    `SELECT COUNT(*) AS total FROM "VENDAS"
     WHERE nr_id_telegram = ANY($1::bigint[]) AND tp_compra = 'ASSINATURA' AND tp_status = 'APROVADA'`,
    [idsConhecidos]
  );
  return Number(assinaturaRows[0]?.total ?? 0) === 0;
}
