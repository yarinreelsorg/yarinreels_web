import "server-only";
import type { PoolClient } from "pg";
import { pool } from "./db";

export type EstadoBlackFriday = {
  /** Percentual do desconto em vigor; null = nenhuma promoção ativa. */
  percentual: number | null;
  incluiPlanos: boolean;
  tsInicio: string | null;
  /** Quantos títulos / planos estão hoje com preço promocional aplicado. */
  totalConteudos: number;
  totalPlanos: number;
};

export type ResultadoBlackFriday = { conteudos: number; planos: number };

export async function obterEstadoBlackFriday(): Promise<EstadoBlackFriday> {
  const [{ rows: config }, { rows: conteudos }, { rows: planos }] = await Promise.all([
    pool.query<{
      nr_percentual_black_friday: number | null;
      sn_black_friday_planos: boolean;
      ts_black_friday_inicio: string | null;
    }>(
      `SELECT nr_percentual_black_friday, sn_black_friday_planos, ts_black_friday_inicio
       FROM "CONFIGURACAO_SITE" LIMIT 1`
    ),
    pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM "CONTEUDOS"
       WHERE vl_aluguel_original IS NOT NULL OR vl_vitalicio_original IS NOT NULL`
    ),
    pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM "PLANOS" WHERE vl_plano_original IS NOT NULL`
    ),
  ]);

  return {
    percentual: config[0]?.nr_percentual_black_friday ?? null,
    incluiPlanos: config[0]?.sn_black_friday_planos ?? false,
    tsInicio: config[0]?.ts_black_friday_inicio ?? null,
    totalConteudos: Number(conteudos[0].total),
    totalPlanos: Number(planos[0].total),
  };
}

/** Preço com desconto, a partir do preço ORIGINAL (nunca do já descontado —
 * por isso trocar 20% por 30% não acumula). Preço nulo continua nulo; preço
 * positivo nunca cai abaixo de R$ 0,01 (gateway recusa valor zerado). */
function sqlPrecoComDesconto(original: string, atual: string) {
  const base = `COALESCE(${original}, ${atual})`;
  return `CASE WHEN ${base} > 0
            THEN GREATEST(ROUND(${base} * (100 - $1) / 100.0, 2), 0.01)
            ELSE ${base} END`;
}

/** Devolve cada preço ao valor de antes da promoção e limpa os backups.
 * Itens que nunca tiveram preço guardado (preço nulo, ou criados/ajustados
 * depois) ficam como estão: COALESCE cai no valor atual. */
async function restaurarPrecos(cliente: PoolClient, incluirPlanos: boolean) {
  const conteudos = await cliente.query(
    `UPDATE "CONTEUDOS" SET
       vl_aluguel = COALESCE(vl_aluguel_original, vl_aluguel),
       vl_vitalicio = COALESCE(vl_vitalicio_original, vl_vitalicio),
       vl_aluguel_original = NULL,
       vl_vitalicio_original = NULL
     WHERE vl_aluguel_original IS NOT NULL OR vl_vitalicio_original IS NOT NULL`
  );

  let planos = 0;
  if (incluirPlanos) {
    const r = await cliente.query(
      `UPDATE "PLANOS" SET
         vl_plano = COALESCE(vl_plano_original, vl_plano),
         vl_plano_original = NULL
       WHERE vl_plano_original IS NOT NULL`
    );
    planos = r.rowCount ?? 0;
  }

  return { conteudos: conteudos.rowCount ?? 0, planos };
}

async function garantirLinhaConfig(cliente: PoolClient) {
  const { rows } = await cliente.query(`SELECT 1 FROM "CONFIGURACAO_SITE" LIMIT 1`);
  if (rows.length === 0) await cliente.query(`INSERT INTO "CONFIGURACAO_SITE" DEFAULT VALUES`);
}

/** Aplica (ou reaplica com outro percentual) o desconto em todos os títulos
 * e, se pedido, nos planos. Tudo numa transação: ou muda tudo, ou nada. */
export async function aplicarBlackFriday(
  percentual: number,
  incluirPlanos: boolean
): Promise<ResultadoBlackFriday> {
  const cliente = await pool.connect();
  try {
    await cliente.query("BEGIN");
    await garantirLinhaConfig(cliente);

    // Se a promoção anterior incluía planos e esta não, devolve os planos
    // pro preço normal antes — senão ficariam descontados sem aparecer.
    const { rows: anterior } = await cliente.query<{ sn_black_friday_planos: boolean }>(
      `SELECT sn_black_friday_planos FROM "CONFIGURACAO_SITE" LIMIT 1`
    );
    if (anterior[0]?.sn_black_friday_planos && !incluirPlanos) {
      await cliente.query(
        `UPDATE "PLANOS" SET vl_plano = COALESCE(vl_plano_original, vl_plano), vl_plano_original = NULL
         WHERE vl_plano_original IS NOT NULL`
      );
    }

    const conteudos = await cliente.query(
      `UPDATE "CONTEUDOS" SET
         vl_aluguel_original = COALESCE(vl_aluguel_original, vl_aluguel),
         vl_vitalicio_original = COALESCE(vl_vitalicio_original, vl_vitalicio),
         vl_aluguel = ${sqlPrecoComDesconto("vl_aluguel_original", "vl_aluguel")},
         vl_vitalicio = ${sqlPrecoComDesconto("vl_vitalicio_original", "vl_vitalicio")}`,
      [percentual]
    );

    let planos = 0;
    if (incluirPlanos) {
      const r = await cliente.query(
        `UPDATE "PLANOS" SET
           vl_plano_original = COALESCE(vl_plano_original, vl_plano),
           vl_plano = ${sqlPrecoComDesconto("vl_plano_original", "vl_plano")}`,
        [percentual]
      );
      planos = r.rowCount ?? 0;
    }

    await cliente.query(
      `UPDATE "CONFIGURACAO_SITE" SET
         nr_percentual_black_friday = $1,
         sn_black_friday_planos = $2,
         ts_black_friday_inicio = COALESCE(ts_black_friday_inicio, now())`,
      [percentual, incluirPlanos]
    );

    await cliente.query("COMMIT");
    return { conteudos: conteudos.rowCount ?? 0, planos };
  } catch (erro) {
    await cliente.query("ROLLBACK").catch(() => {});
    throw erro;
  } finally {
    cliente.release();
  }
}

/** Encerra a promoção: todos os preços voltam ao valor de antes. */
export async function encerrarBlackFriday(): Promise<ResultadoBlackFriday> {
  const cliente = await pool.connect();
  try {
    await cliente.query("BEGIN");
    await garantirLinhaConfig(cliente);

    // Restaura planos sempre (não só se a flag diz que entraram): se sobrou
    // algum plano com backup, ele precisa voltar ao preço normal.
    const resultado = await restaurarPrecos(cliente, true);

    await cliente.query(
      `UPDATE "CONFIGURACAO_SITE" SET
         nr_percentual_black_friday = NULL,
         sn_black_friday_planos = false,
         ts_black_friday_inicio = NULL`
    );

    await cliente.query("COMMIT");
    return resultado;
  } catch (erro) {
    await cliente.query("ROLLBACK").catch(() => {});
    throw erro;
  } finally {
    cliente.release();
  }
}
