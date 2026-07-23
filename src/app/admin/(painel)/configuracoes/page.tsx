import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSessaoAdmin } from "@/lib/admin-auth";
import { obterTaxaCartao } from "@/lib/pagamento";
import type { Administrador } from "@/types/database";
import ConfiguracoesClient from "./ConfiguracoesClient";

export const revalidate = 0;

export default async function ConfiguracoesPage() {
  const sessao = await getSessaoAdmin();
  const supabase = createSupabaseAdminClient();

  const [{ data }, taxaCartao] = await Promise.all([
    supabase.from("ADMINISTRADORES").select("*").order("ts_criacao", { ascending: true }),
    obterTaxaCartao(supabase),
  ]);

  const administradores: Administrador[] = data ?? [];

  return (
    <ConfiguracoesClient
      administradores={administradores}
      cdAdministradorAtual={sessao?.cd_administrador ?? null}
      papelAtual={sessao?.tp_papel ?? "ADMIN"}
      taxaCartaoInicial={taxaCartao}
    />
  );
}
