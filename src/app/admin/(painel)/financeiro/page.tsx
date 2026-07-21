import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Conteudo, Venda } from "@/types/database";
import FinanceiroClient from "./FinanceiroClient";

export const revalidate = 0;

export default async function FinanceiroPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: vendasData }, { data: conteudosData }] = await Promise.all([
    supabase.from("VENDAS").select("*"),
    supabase.from("CONTEUDOS").select("*"),
  ]);

  const vendas: Venda[] = vendasData ?? [];
  const conteudos: Conteudo[] = conteudosData ?? [];

  return <FinanceiroClient vendas={vendas} conteudos={conteudos} />;
}
