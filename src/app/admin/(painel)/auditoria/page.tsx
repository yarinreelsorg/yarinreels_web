import { pool } from "@/lib/db";
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

  const valores: unknown[] = [];
  const whereSql = busca
    ? (() => {
        valores.push(`%${busca}%`);
        return `WHERE nm_administrador ILIKE $${valores.length} OR nm_entidade ILIKE $${valores.length}`;
      })()
    : "";

  valores.push(ITENS_POR_PAGINA, (pagina - 1) * ITENS_POR_PAGINA);

  const { rows } = await pool.query<LogAuditoria & { total_count: string }>(
    `SELECT *, COUNT(*) OVER() AS total_count FROM "LOGS_AUDITORIA" ${whereSql}
     ORDER BY ts_criacao DESC LIMIT $${valores.length - 1} OFFSET $${valores.length}`,
    valores
  );

  const logs: LogAuditoria[] = rows;
  const totalRegistros = Number(rows[0]?.total_count ?? 0);

  return (
    <AuditoriaClient
      logs={logs}
      totalRegistros={totalRegistros}
      itensPorPagina={ITENS_POR_PAGINA}
      pagina={pagina}
      busca={busca}
    />
  );
}
