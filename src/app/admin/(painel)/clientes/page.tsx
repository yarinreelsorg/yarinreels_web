import { createSupabaseServerClient } from "@/lib/supabase/server";
import ClientesAdminClient from "./ClientesAdminClient";

export const revalidate = 0;

export default async function ClientesAdminPage() {
  const supabase = await createSupabaseServerClient();
  const { data: vendasData } = await supabase.from("VENDAS").select("*");
  const { data: conteudosData } = await supabase.from("CONTEUDOS").select("*");
  const { data: planosData } = await supabase.from("PLANOS").select("*");

  return (
    <ClientesAdminClient
      vendas={vendasData ?? []}
      conteudos={conteudosData ?? []}
      planos={planosData ?? []}
    />
  );
}
