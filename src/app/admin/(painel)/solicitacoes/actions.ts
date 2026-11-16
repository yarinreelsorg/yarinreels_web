"use server";

import { pool } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Chave SQL: ignora maiúsculas/minúsculas e espaços sobrando (inclusive
// duplos no meio). É o "nome exato" de um pedido — usada igual no SELECT, no
// DELETE e no aviso. A junção de nomes parecidos é feita depois, em JS.
const CHAVE_TITULO = `lower(regexp_replace(trim(ds_titulo), '\\s+', ' ', 'g'))`;

export type SolicitacaoAgrupada = {
  /** Identificador estável do grupo na UI (= primeira chave SQL). */
  chave: string;
  /** Todas as chaves SQL (nomes exatos) que caem neste grupo. */
  chaves: string[];
  ds_titulo: string;
  /** Outras grafias/títulos pedidos que foram juntados neste grupo. */
  variacoes: string[];
  total: number;
  ultima_solicitacao: string;
};

/** Forma comparável do título: sem acento, sem pontuação, minúsculo. */
function normalizarTitulo(titulo: string) {
  return titulo
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export async function listarSolicitacoesAgrupadas(): Promise<SolicitacaoAgrupada[]> {
  const { rows } = await pool.query<{
    chave: string;
    ds_titulo: string;
    total: string;
    ultima_solicitacao: string;
  }>(
    `SELECT ${CHAVE_TITULO} AS chave,
            (array_agg(ds_titulo ORDER BY ts_criacao))[1] AS ds_titulo,
            COUNT(*) AS total,
            MAX(ts_criacao) AS ultima_solicitacao
     FROM "SOLICITACOES_DRAMA"
     GROUP BY chave`
  );

  const nomes = rows
    .map((r) => ({
      chave: r.chave,
      ds_titulo: r.ds_titulo,
      total: Number(r.total),
      ultima: new Date(r.ultima_solicitacao).getTime(),
      norm: normalizarTitulo(r.ds_titulo),
    }))
    // Mais curtos primeiro: o nome curto vira a "raiz" e os mais longos
    // ("X" e "X e seu marido bilionário") são anexados a ele.
    .sort((a, b) => a.norm.length - b.norm.length);

  const grupos: { raiz: string; membros: typeof nomes }[] = [];
  for (const n of nomes) {
    // Mesmo título sem acento/pontuação, ou começa com um título de 2+
    // palavras já existente (limite de palavra, pra "mae solo" não engolir
    // "mae soloista"). 2+ palavras evita que "A" ou "Amor" juntem tudo.
    const grupo = grupos.find(
      (g) =>
        n.norm === g.raiz ||
        (g.raiz.includes(" ") && n.norm.startsWith(`${g.raiz} `))
    );
    if (grupo) grupo.membros.push(n);
    else grupos.push({ raiz: n.norm, membros: [n] });
  }

  return grupos
    .map(({ membros }) => {
      // Título exibido: o nome mais pedido (empate: o mais recente).
      const principal = [...membros].sort((a, b) => b.total - a.total || b.ultima - a.ultima)[0];
      return {
        chave: membros[0].chave,
        chaves: membros.map((m) => m.chave),
        ds_titulo: principal.ds_titulo,
        variacoes: membros
          .filter((m) => m !== principal)
          .map((m) => m.ds_titulo),
        total: membros.reduce((soma, m) => soma + m.total, 0),
        ultima: Math.max(...membros.map((m) => m.ultima)),
      };
    })
    .sort((a, b) => b.ultima - a.ultima)
    .map(({ ultima, ...g }) => ({ ...g, ultima_solicitacao: new Date(ultima).toISOString() }));
}

/** Remove todos os pedidos daquele(s) título(s) — usado quando o drama já
 * foi trazido pro catálogo (ou quando o pedido era spam/duplicata de grafia). */
export async function excluirSolicitacao(chaves: string[]) {
  if (chaves.length === 0) return;
  await pool.query(
    `DELETE FROM "SOLICITACOES_DRAMA" WHERE ${CHAVE_TITULO} = ANY($1::text[])`,
    [chaves]
  );
  revalidatePath("/admin/solicitacoes");
}

/** Avisa por Telegram todo mundo que pediu aquele(s) título(s) (já trazido
 * pro catálogo) e remove os pedidos da lista. Aceita várias chaves (grafias
 * diferentes do mesmo drama): cada cliente recebe UM aviso só, mesmo que
 * tenha pedido mais de uma das grafias — mesmo bot do Mini App legado,
 * chamando a API HTTP do Telegram direto (esse app não roda o bot). */
export async function avisarSolicitacao(chaves: string[], titulo: string) {
  if (chaves.length === 0) return;
  const botToken = process.env.BOT_TOKEN;
  if (!botToken) throw new Error("BOT_TOKEN não configurado neste app.");

  const { rows } = await pool.query<{ nr_id_telegram: number }>(
    `SELECT DISTINCT nr_id_telegram FROM "SOLICITACOES_DRAMA" WHERE ${CHAVE_TITULO} = ANY($1::text[])`,
    [chaves]
  );

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  const texto = `🎬 Boas notícias! O drama que você pediu, "${titulo}", já está disponível no Melreels!\n\nAbra o app e aproveite 🍿`;

  await Promise.all(
    rows.map(({ nr_id_telegram }) =>
      fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: nr_id_telegram,
          text: texto,
          ...(botUsername
            ? { reply_markup: { inline_keyboard: [[{ text: "🚀 Abrir Melreels", url: `https://t.me/${botUsername}` }]] } }
            : {}),
        }),
      }).catch(() => {
        // Cliente pode ter bloqueado o bot — não deve travar o aviso dos outros.
      })
    )
  );

  await pool.query(`DELETE FROM "SOLICITACOES_DRAMA" WHERE ${CHAVE_TITULO} = ANY($1::text[])`, [chaves]);
  revalidatePath("/admin/solicitacoes");
}
