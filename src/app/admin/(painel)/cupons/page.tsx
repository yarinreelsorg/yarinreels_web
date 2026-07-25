import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import CuponsAdminClient from "./CuponsAdminClient";
import type { Cupom } from "@/types/database";

export const revalidate = 0;

export default async function CuponsAdminPage() {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("CUPONS").select("*").order("ts_criacao", { ascending: false });
  const cupons: Cupom[] = data ?? [];

  return <CuponsAdminClient cuponsInicial={cupons} />;
}
