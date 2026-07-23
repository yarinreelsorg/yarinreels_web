import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/types";

/** Taxa fixa adicional cobrada em pagamentos com cartão (config. pelo admin). */
export async function obterTaxaCartao(supabase: SupabaseClient<Database>): Promise<number> {
  const { data } = await supabase
    .from("CONFIGURACAO_PAGAMENTO")
    .select("vl_taxa_cartao")
    .limit(1)
    .maybeSingle();

  return data?.vl_taxa_cartao ?? 0;
}
