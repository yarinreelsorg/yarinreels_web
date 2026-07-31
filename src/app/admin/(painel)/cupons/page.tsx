import { pool } from "@/lib/db";
import CuponsAdminClient from "./CuponsAdminClient";
import type { Cupom } from "@/types/database";

export const revalidate = 0;

export default async function CuponsAdminPage() {
  const { rows: cupons } = await pool.query<Cupom>('SELECT * FROM "CUPONS" ORDER BY ts_criacao DESC');

  return <CuponsAdminClient cuponsInicial={cupons} />;
}
