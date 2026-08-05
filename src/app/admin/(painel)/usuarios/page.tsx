import { pool } from "@/lib/db";
import UsuariosAdminClient from "./UsuariosAdminClient";
import type { Usuario } from "@/types/database";

export const revalidate = 0;

export default async function UsuariosAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const busca = typeof params.busca === "string" ? params.busca : "";

  const valores: unknown[] = [];
  const whereSql = busca
    ? (() => {
        valores.push(`%${busca}%`);
        return `WHERE nm_email ILIKE $1 OR nm_nome ILIKE $1`;
      })()
    : "";

  const { rows } = await pool.query<Usuario>(
    `SELECT * FROM "USUARIOS" ${whereSql} ORDER BY ts_criacao DESC LIMIT 200`,
    valores
  );

  return <UsuariosAdminClient usuarios={rows} buscaAtual={busca} />;
}
