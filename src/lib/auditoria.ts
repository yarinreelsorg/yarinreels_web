import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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
    const supabase = createSupabaseAdminClient();

    await supabase.from("LOGS_AUDITORIA").insert({
      cd_administrador: sessao?.cd_administrador ?? null,
      nm_administrador: sessao?.nm_nome ?? "Desconhecido",
      tp_acao: params.tp_acao,
      nm_entidade: params.nm_entidade,
      cd_entidade: params.cd_entidade ?? null,
      ds_detalhes: params.ds_detalhes ?? null,
    });
  } catch {
    // auditoria é best-effort — nunca deve quebrar a ação principal
  }
}
