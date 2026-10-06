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

/** Avisa por Telegram todo mundo que pediu aquele título (já trazido pro
 * catálogo) e remove os pedidos da lista — mesmo bot do Mini App legado,
 * chamando a API HTTP do Telegram direto (esse app não roda o bot). */
export async function avisarSolicitacao(chave: string, titulo: string) {
  const botToken = process.env.BOT_TOKEN;
  if (!botToken) throw new Error("BOT_TOKEN não configurado neste app.");

  const { rows } = await pool.query<{ nr_id_telegram: number }>(
    `SELECT DISTINCT nr_id_telegram FROM "SOLICITACOES_DRAMA" WHERE lower(trim(ds_titulo)) = $1`,
    [chave]
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

  await pool.query(`DELETE FROM "SOLICITACOES_DRAMA" WHERE lower(trim(ds_titulo)) = $1`, [chave]);
  revalidatePath("/admin/solicitacoes");
}
