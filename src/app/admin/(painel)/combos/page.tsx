import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import CombosAdminClient from "./CombosAdminClient";
import type { ComboPromocional, Conteudo } from "@/types/database";

export const revalidate = 0;

export default async function CombosAdminPage() {
  const supabase = createSupabaseAdminClient();

  const [{ data: combosData }, { data: conteudosData }] = await Promise.all([
    supabase.from("COMBOS_PROMOCIONAIS").select("*").order("ts_criacao", { ascending: false }),
    supabase.from("CONTEUDOS").select("*").order("nm_titulo", { ascending: true }),
  ]);

  const combos: ComboPromocional[] = combosData ?? [];
  const conteudos: Conteudo[] = conteudosData ?? [];

  return <CombosAdminClient combosInicial={combos} conteudos={conteudos} />;
}
