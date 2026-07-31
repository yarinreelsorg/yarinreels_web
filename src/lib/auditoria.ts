import "server-only";
import { pool } from "@/lib/db";
import { getSessaoAdmin } from "@/lib/admin-auth";

export type AcaoAuditoria =
  | "CRIACAO"
  | "EDICAO"
  | "EXCLUSAO"
  | "RESTAURACAO"
  | "CONCESSAO_ACESSO"
  | "REVOGACAO_ACESSO"
  | "BANIMENTO"
  | "DESBANIMENTO"
  | "ALTERACAO_STATUS"
  | "ALTERACAO_PAPEL"
  | "ALTERACAO_CONFIGURACAO";

/**
 * Registra uma ação no log de auditoria com o administrador da sessão
 * atual. Nunca lança erro — auditoria não pode derrubar a ação principal
 * que está sendo registrada (ex: se o log falhar, a exclusão do conteúdo
 * já aconteceu e não deve ser desfeita por causa disso).
 */
export async function registrarLog(params: {
  tp_acao: AcaoAuditoria;
  nm_entidade: string;
  cd_entidade?: string | null;
  ds_detalhes?: Record<string, unknown> | null;
}) {
  try {
    const sessao = await getSessaoAdmin();

    await pool.query(
      `INSERT INTO "LOGS_AUDITORIA"
         (cd_administrador, nm_administrador, tp_acao, nm_entidade, cd_entidade, ds_detalhes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        sessao?.cd_administrador ?? null,
        sessao?.nm_nome ?? "Desconhecido",
        params.tp_acao,
        params.nm_entidade,
        params.cd_entidade ?? null,
        params.ds_detalhes ? JSON.stringify(params.ds_detalhes) : null,
      ]
    );
  } catch {
    // auditoria é best-effort — nunca deve quebrar a ação principal
  }
}
