import "server-only";
import { pool } from "./db";

/**
 * Sinônimos de categoria usados pelo bot legado: um plano de categoria X
 * também libera conteúdos da categoria equivalente.
 */
const GRUPOS_CATEGORIA_EQUIVALENTE = [
  ["dorama", "asiatica", "asiaticas"],
  ["americana", "americano", "americanas", "americanos"],
];

const CATEGORIAS_CURINGA = ["todas", "tudo", "todos"];

function normalizarCategoria(categoria: string) {
  return categoria
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function categoriasCompativeis(categoriaPlano: string, categoriaConteudo: string) {
  const plano = normalizarCategoria(categoriaPlano);
  const conteudo = normalizarCategoria(categoriaConteudo);

  if (CATEGORIAS_CURINGA.includes(plano)) return true;
  if (plano === conteudo) return true;

  return GRUPOS_CATEGORIA_EQUIVALENTE.some(
    (grupo) => grupo.includes(plano) && grupo.includes(conteudo)
  );
}

/**
 * Todo usuário web precisa de um "nr_id_telegram" pra ter compras registradas
 * em VENDAS (schema do bot legado, não pode mudar). Quem nunca vinculou o
 * Telegram de verdade ganha uma identidade sintética só pra comprar pelo
 * site — negativa, porque IDs reais de usuário do Telegram são sempre
 * positivos, então nunca colide com um ID real.
 */
function gerarIdWebSintetico() {
  return -(Math.floor(Math.random() * 900_000_000) + 100_000_000);
}

/**
 * Garante que o usuário tenha uma identidade pra comprar pelo site
 * (cria e salva uma na primeira vez que for necessário, direto no banco —
 * não depende do cookie de sessão estar atualizado) e devolve os
 * nr_id_telegram que valem pra checar acesso: a identidade web sempre,
 * mais a conta real do Telegram se ele já tiver vinculado.
 */
export async function obterIdsTelegramElegiveis(cdUsuario: string): Promise<number[]> {
  const { rows } = await pool.query<{
    nr_id_telegram: number | null;
    nr_id_telegram_web: number | null;
  }>('SELECT nr_id_telegram, nr_id_telegram_web FROM "USUARIOS" WHERE cd_usuario = $1', [
    cdUsuario,
  ]);
  const usuario = rows[0];
  if (!usuario) return [];

  let idWeb = usuario.nr_id_telegram_web;
  if (!idWeb) {
    idWeb = gerarIdWebSintetico();
    await pool.query('UPDATE "USUARIOS" SET nr_id_telegram_web = $1 WHERE cd_usuario = $2', [
      idWeb,
      cdUsuario,
    ]);
  }

  return usuario.nr_id_telegram ? [idWeb, usuario.nr_id_telegram] : [idWeb];
}

/**
 * Identidade a usar quando o cliente COMPRA algo agora: a conta real do
 * Telegram, se já vinculada (consolida com o que ele compra pelo bot);
 * senão a identidade web sintética.
 */
export async function obterIdentidadeParaCompra(cdUsuario: string): Promise<number> {
  const ids = await obterIdsTelegramElegiveis(cdUsuario);
  return ids[ids.length - 1];
}

/** Validade por tipo de compra — mesma regra usada na concessão manual pelo admin. */
export const DIAS_ALUGUEL = 7;
export const DIAS_VITALICIO = 18250;

export function somarDias(dias: number) {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return data.toISOString();
}

export type MotivoAcesso = "ALUGUEL" | "VITALICIO" | "ASSINATURA";

export type StatusAcesso =
  | { liberado: true; motivo: MotivoAcesso; expiraEm: string }
  | { liberado: false };

/**
 * Confere no servidor se algum dos nr_id_telegram do cliente (identidade
 * web e/ou conta real do Telegram vinculada) tem uma VENDA aprovada e
 * ainda válida (aluguel/vitalício do próprio conteúdo, ou assinatura de
 * categoria compatível) que dê acesso a esse conteúdo.
 */
export async function verificarAcessoConteudo(
  nrIdsTelegram: number[],
  conteudo: { cd_conteudo: string; nm_categoria: string }
): Promise<StatusAcesso> {
  if (nrIdsTelegram.length === 0) return { liberado: false };

  const { rows: banidos } = await pool.query(
    'SELECT 1 FROM "BANS" WHERE nr_id_telegram = ANY($1::bigint[])',
    [nrIdsTelegram]
  );
  if (banidos.length > 0) return { liberado: false };

  const agora = new Date().toISOString();

  interface VendaAcesso {
    tp_compra: MotivoAcesso;
    cd_conteudo: string | null;
    cd_plano: string | null;
    ts_expiracao: string | null;
  }

  const { rows: vendas } = await pool.query<VendaAcesso>(
    `SELECT tp_compra, cd_conteudo, cd_plano, ts_expiracao FROM "VENDAS"
     WHERE nr_id_telegram = ANY($1::bigint[]) AND tp_status = 'APROVADA' AND ts_expiracao > $2`,
    [nrIdsTelegram, agora]
  );

  if (vendas.length === 0) {
    return { liberado: false };
  }

  const direta = vendas.find(
    (v) =>
      (v.tp_compra === "ALUGUEL" || v.tp_compra === "VITALICIO") &&
      v.cd_conteudo === conteudo.cd_conteudo
  );
  if (direta && direta.ts_expiracao) {
    return {
      liberado: true,
      motivo: direta.tp_compra,
      expiraEm: direta.ts_expiracao,
    };
  }

  const assinaturas = vendas.filter(
    (v): v is VendaAcesso & { cd_plano: string; ts_expiracao: string } =>
      v.tp_compra === "ASSINATURA" && !!v.cd_plano && !!v.ts_expiracao
  );

  if (assinaturas.length > 0) {
    const { rows: planos } = await pool.query<{ cd_plano: string; nm_categoria: string }>(
      'SELECT cd_plano, nm_categoria FROM "PLANOS" WHERE cd_plano = ANY($1::uuid[])',
      [assinaturas.map((v) => v.cd_plano)]
    );

    for (const venda of assinaturas) {
      const plano = planos.find((p) => p.cd_plano === venda.cd_plano);
      if (plano && categoriasCompativeis(plano.nm_categoria, conteudo.nm_categoria)) {
        return { liberado: true, motivo: "ASSINATURA", expiraEm: venda.ts_expiracao };
      }
    }
  }

  return { liberado: false };
}
