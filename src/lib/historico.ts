import "server-only";
import { pool } from "./db";
import type { Conteudo } from "@/types/database";

/** Só vale a pena "continuar assistindo" entre 3% e 92% do vídeo — fora
 * disso é como se não tivesse começado, ou já terminou. */
const INICIO_MINIMO = 0.03;
const FIM_MAXIMO = 0.92;

export async function registrarProgresso(
  cdUsuario: string,
  cdConteudo: string,
  segundoAtual: number,
  duracaoTotal: number | null
) {
  if (duracaoTotal && duracaoTotal > 0) {
    const fracao = segundoAtual / duracaoTotal;
    if (fracao < INICIO_MINIMO) return;
    if (fracao > FIM_MAXIMO) {
      await removerHistorico(cdUsuario, cdConteudo);
      return;
    }
  }

  await pool.query(
    `INSERT INTO "HISTORICO_VISUALIZACAO" (cd_usuario, cd_conteudo, nr_segundo_atual, nr_duracao_total, ts_atualizacao)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (cd_usuario, cd_conteudo)
     DO UPDATE SET nr_segundo_atual = $3, nr_duracao_total = $4, ts_atualizacao = now()`,
    [cdUsuario, cdConteudo, Math.floor(segundoAtual), duracaoTotal ? Math.floor(duracaoTotal) : null]
  );
}

export async function removerHistorico(cdUsuario: string, cdConteudo: string) {
  await pool.query(
    'DELETE FROM "HISTORICO_VISUALIZACAO" WHERE cd_usuario = $1 AND cd_conteudo = $2',
    [cdUsuario, cdConteudo]
  );
}

export type ItemContinuarAssistindo = {
  conteudo: Conteudo;
  segundoAtual: number;
  duracaoTotal: number | null;
  progresso: number;
};

export async function obterContinuarAssistindo(
  cdUsuario: string,
  limite = 12
): Promise<ItemContinuarAssistindo[]> {
  const { rows } = await pool.query<
    Conteudo & { nr_segundo_atual: number; nr_duracao_total: number | null }
  >(
    `SELECT c.*, h.nr_segundo_atual, h.nr_duracao_total
     FROM "HISTORICO_VISUALIZACAO" h
     JOIN "CONTEUDOS" c ON c.cd_conteudo = h.cd_conteudo
     WHERE h.cd_usuario = $1
     ORDER BY h.ts_atualizacao DESC
     LIMIT $2`,
    [cdUsuario, limite]
  );

  return rows.map((row) => {
    const { nr_segundo_atual, nr_duracao_total, ...conteudo } = row;
    return {
      conteudo,
      segundoAtual: nr_segundo_atual,
      duracaoTotal: nr_duracao_total,
      progresso: nr_duracao_total ? Math.min(100, (nr_segundo_atual / nr_duracao_total) * 100) : 0,
    };
  });
}
