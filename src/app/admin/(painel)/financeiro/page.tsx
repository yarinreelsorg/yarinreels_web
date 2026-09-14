import { pool } from "@/lib/db";
import type { Conteudo, Plano, Venda } from "@/types/database";
import FinanceiroClient from "./FinanceiroClient";

export const revalidate = 0;

export default async function FinanceiroPage() {
  const [{ rows: vendas }, { rows: conteudos }, { rows: planos }] = await Promise.all([
    pool.query<Venda>('SELECT * FROM "VENDAS"'),
    pool.query<Conteudo>('SELECT * FROM "CONTEUDOS"'),
    pool.query<Plano>('SELECT * FROM "PLANOS"'),
  ]);

  return <FinanceiroClient vendas={vendas} conteudos={conteudos} planos={planos} />;
}
