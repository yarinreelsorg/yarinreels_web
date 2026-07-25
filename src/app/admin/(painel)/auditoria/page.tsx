import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import AuditoriaClient from "./AuditoriaClient";
import type { LogAuditoria } from "@/types/database";

export const revalidate = 0;

const ITENS_POR_PAGINA = 25;

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const busca = typeof params.busca === "string" ? params.busca : "";
  const pagina = Math.max(1, Number(params.page) || 1);

  const supabase = createSupabaseAdminClient();

  let query = supabase.from("LOGS_AUDITORIA").select("*", { count: "exact" });
  if (busca) {
    query = query.or(`nm_administrador.ilike.%${busca}%,nm_entidade.ilike.%${busca}%`);
  }
  query = query
    .order("ts_criacao", { ascending: false })
    .range((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA - 1);

  const { data, count } = await query;
  const logs: LogAuditoria[] = data ?? [];

  return (
    <AuditoriaClient
      logs={logs}
      totalRegistros={count ?? 0}
      itensPorPagina={ITENS_POR_PAGINA}
      pagina={pagina}
      busca={busca}
    />
  );
}
