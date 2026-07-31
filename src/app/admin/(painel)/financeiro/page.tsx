import { pool } from "@/lib/db";
import type { Conteudo, Venda } from "@/types/database";
import FinanceiroClient from "./FinanceiroClient";

export const revalidate = 0;

export default async function FinanceiroPage() {
  const [{ rows: vendas }, { rows: conteudos }] = await Promise.all([
    pool.query<Venda>('SELECT * FROM "VENDAS"'),
    pool.query<Conteudo>('SELECT * FROM "CONTEUDOS"'),
  ]);

  return <FinanceiroClient vendas={vendas} conteudos={conteudos} />;
}
