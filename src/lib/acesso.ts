import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "./supabase/types";
import { createSupabaseAdminClient } from "./supabase/admin";

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
 * (cria e salva uma na primeira vez que for necessário) e devolve os
 * nr_id_telegram que valem pra checar acesso: a identidade web sempre,
 * mais a conta real do Telegram se ele já tiver vinculado.
 */
export async function obterIdsTelegramElegiveis(user: User): Promise<number[]> {
  const metadata = user.user_metadata ?? {};

  let idWeb =
    typeof metadata.nr_id_telegram_web === "number" ? metadata.nr_id_telegram_web : null;

  if (!idWeb) {
    idWeb = gerarIdWebSintetico();
    const admin = createSupabaseAdminClient();
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...metadata, nr_id_telegram_web: idWeb },
    });
  }

  const idTelegramReal =
    typeof metadata.nr_id_telegram === "number" ? metadata.nr_id_telegram : null;

  return idTelegramReal ? [idWeb, idTelegramReal] : [idWeb];
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
  supabase: SupabaseClient<Database>,
  nrIdsTelegram: number[],
  conteudo: { cd_conteudo: string; nm_categoria: string }
): Promise<StatusAcesso> {
  const agora = new Date().toISOString();

  const { data: vendas } = await supabase
    .from("VENDAS")
    .select("*")
    .in("nr_id_telegram", nrIdsTelegram)
    .eq("tp_status", "APROVADA")
    .gt("ts_expiracao", agora);

  if (!vendas || vendas.length === 0) {
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
      motivo: direta.tp_compra as MotivoAcesso,
      expiraEm: direta.ts_expiracao,
    };
  }

  const assinaturas = vendas.filter(
    (v): v is typeof v & { cd_plano: string; ts_expiracao: string } =>
      v.tp_compra === "ASSINATURA" && !!v.cd_plano && !!v.ts_expiracao
  );

  if (assinaturas.length > 0) {
    const { data: planos } = await supabase
      .from("PLANOS")
      .select("cd_plano, nm_categoria")
      .in(
        "cd_plano",
        assinaturas.map((v) => v.cd_plano)
      );

    for (const venda of assinaturas) {
      const plano = planos?.find((p) => p.cd_plano === venda.cd_plano);
      if (plano && categoriasCompativeis(plano.nm_categoria, conteudo.nm_categoria)) {
        return { liberado: true, motivo: "ASSINATURA", expiraEm: venda.ts_expiracao };
      }
    }
  }

  return { liberado: false };
}
