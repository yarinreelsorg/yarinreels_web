import { pool } from "@/lib/db";
import type { Conteudo } from "@/types/database";
import DestaquesAdminClient from "./DestaquesAdminClient";

export const revalidate = 0;

export default async function DestaquesAdminPage() {
  const { rows: conteudos } = await pool.query<Conteudo>(
    'SELECT * FROM "CONTEUDOS" ORDER BY nm_titulo ASC'
  );

  return <DestaquesAdminClient conteudos={conteudos} />;
}
