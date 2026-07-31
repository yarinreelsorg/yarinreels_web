import { pool } from "@/lib/db";
import CombosAdminClient from "./CombosAdminClient";
import type { ComboPromocional, Conteudo } from "@/types/database";

export const revalidate = 0;

export default async function CombosAdminPage() {
  const [{ rows: combos }, { rows: conteudos }] = await Promise.all([
    pool.query<ComboPromocional>('SELECT * FROM "COMBOS_PROMOCIONAIS" ORDER BY ts_criacao DESC'),
    pool.query<Conteudo>('SELECT * FROM "CONTEUDOS" ORDER BY nm_titulo ASC'),
  ]);

  return <CombosAdminClient combosInicial={combos} conteudos={conteudos} />;
}
