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

/**
 * Confere se o usuário tem alguma assinatura APROVADA e ainda dentro da
 * validade — usado pra liberar conteúdos marcados como exclusivos pra
 * assinantes. Não usa obterIdsTelegramElegiveis de propósito (essa função
 * cria uma identidade sintética na hora); aqui só lemos o que já existe.
 */
export async function usuarioTemAssinaturaAtiva(cdUsuario: string): Promise<boolean> {
  const { rows } = await pool.query<{
    nr_id_telegram: number | null;
    nr_id_telegram_web: number | null;
  }>('SELECT nr_id_telegram, nr_id_telegram_web FROM "USUARIOS" WHERE cd_usuario = $1 LIMIT 1', [
    cdUsuario,
  ]);
  const usuario = rows[0];
  if (!usuario) return false;

  const ids = [usuario.nr_id_telegram, usuario.nr_id_telegram_web].filter(
    (id): id is number => !!id
  );
  if (ids.length === 0) return false;

  const { rows: assinaturaRows } = await pool.query<{ total: string }>(
    `SELECT COUNT(*) AS total FROM "VENDAS"
     WHERE nr_id_telegram = ANY($1::bigint[]) AND tp_compra = 'ASSINATURA'
       AND tp_status = 'APROVADA' AND ts_expiracao > now()`,
    [ids]
  );
  return Number(assinaturaRows[0]?.total ?? 0) > 0;
}

/**
 * Categorias liberadas pelas assinaturas ativas do usuário — usado pra
 * home/carrosséis mostrarem "Assistir" direto em vez de preço/Comprar pra
 * quem já tem acesso incluso (igual o bot já faz), sem precisar checar
 * item por item.
 */
export async function obterCategoriasAssinaturaAtiva(cdUsuario: string): Promise<string[]> {
  const { rows } = await pool.query<{
    nr_id_telegram: number | null;
    nr_id_telegram_web: number | null;
  }>('SELECT nr_id_telegram, nr_id_telegram_web FROM "USUARIOS" WHERE cd_usuario = $1 LIMIT 1', [
    cdUsuario,
  ]);
  const usuario = rows[0];
  if (!usuario) return [];

  const ids = [usuario.nr_id_telegram, usuario.nr_id_telegram_web].filter(
    (id): id is number => !!id
  );
  if (ids.length === 0) return [];

  const { rows: planos } = await pool.query<{ nm_categoria: string }>(
    `SELECT DISTINCT p.nm_categoria FROM "VENDAS" v
     JOIN "PLANOS" p ON p.cd_plano = v.cd_plano
     WHERE v.nr_id_telegram = ANY($1::bigint[]) AND v.tp_compra = 'ASSINATURA'
       AND v.tp_status = 'APROVADA' AND v.ts_expiracao > now()`,
    [ids]
  );
  return planos.map((p) => p.nm_categoria);
}

export function conteudoIncluidoEmCategorias(nmCategoriaConteudo: string, categoriasPlano: string[]) {
  return categoriasPlano.some((cat) => categoriasCompativeis(cat, nmCategoriaConteudo));
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
  | { liberado: false; emCarencia?: boolean };

/**
 * Lançamento ainda dentro da janela de carência (configurável no admin) —
 * acesso por assinatura fica bloqueado por um tempo pra evitar que
 * assinante grave e pirateie no dia do lançamento, e pra dar tempo de
 * vender avulso antes. Acesso por aluguel/vitalício nunca é afetado.
 */
function dentroDaCarencia(dtLancamento: string | null, carenciaHoras: number) {
  if (!carenciaHoras || !dtLancamento) return false;
  const limiteMs = new Date(dtLancamento).getTime() + carenciaHoras * 60 * 60 * 1000;
  return Date.now() < limiteMs;
}

export interface InfoBanimento {
  banido: boolean;
  tp_banimento?: "TOTAL" | "COMPRAS" | "PERSONALIZADO";
  ds_acoes_bloqueadas?: string[];
  ds_motivo?: string | null;
  ds_mensagem_bloqueio?: string | null;
}

export async function obterBanimentoUsuario(nrIdsTelegram: number[]): Promise<InfoBanimento> {
  if (nrIdsTelegram.length === 0) return { banido: false };

  const { rows } = await pool.query<{
    tp_banimento: "TOTAL" | "COMPRAS" | "PERSONALIZADO" | null;
    ds_acoes_bloqueadas: string[] | null;
    ds_motivo: string | null;
    ds_mensagem_bloqueio: string | null;
  }>(
    'SELECT tp_banimento, ds_acoes_bloqueadas, ds_motivo, ds_mensagem_bloqueio FROM "BANS" WHERE nr_id_telegram = ANY($1::text[]) LIMIT 1',
    [nrIdsTelegram.map(String)]
  );

  const ban = rows[0];
  if (!ban) return { banido: false };

  return {
    banido: true,
    tp_banimento: ban.tp_banimento ?? "TOTAL",
    ds_acoes_bloqueadas: ban.ds_acoes_bloqueadas ?? [],
    ds_motivo: ban.ds_motivo,
    ds_mensagem_bloqueio: ban.ds_mensagem_bloqueio,
  };
}

/**
 * Confere no servidor se algum dos nr_id_telegram do cliente (identidade
 * web e/ou conta real do Telegram vinculada) tem uma VENDA aprovada e
 * ainda válida (aluguel/vitalício do próprio conteúdo, ou assinatura de
 * categoria compatível) que dê acesso a esse conteúdo.
 */
export async function verificarAcessoConteudo(
  nrIdsTelegram: number[],
  conteudo: { cd_conteudo: string; nm_categoria: string; dt_lancamento: string | null },
  carenciaHoras = 0
): Promise<StatusAcesso> {
  if (nrIdsTelegram.length === 0) return { liberado: false };

  const banInfo = await obterBanimentoUsuario(nrIdsTelegram);
  // Banimento TOTAL impede visualização do acervo.
  // Banimento de COMPRAS ou PERSONALIZADO permite assistir o que já foi comprado antes!
  if (banInfo.banido && banInfo.tp_banimento === "TOTAL") {
    return { liberado: false };
  }

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

  const emCarencia = dentroDaCarencia(conteudo.dt_lancamento, carenciaHoras);

  const assinaturas = vendas.filter(
    (v): v is VendaAcesso & { cd_plano: string; ts_expiracao: string } =>
      v.tp_compra === "ASSINATURA" && !!v.cd_plano && !!v.ts_expiracao
  );

  if (assinaturas.length > 0 && !emCarencia) {
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

  return { liberado: false, emCarencia };
}
