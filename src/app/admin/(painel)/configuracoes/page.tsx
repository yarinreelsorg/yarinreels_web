import { pool } from "@/lib/db";
import { getSessaoAdmin } from "@/lib/admin-auth";
import { obterTaxaCartao } from "@/lib/pagamento";
import type { Administrador } from "@/types/database";
import ConfiguracoesClient from "./ConfiguracoesClient";

export const revalidate = 0;

export default async function ConfiguracoesPage() {
  const [sessao, { rows: administradores }, taxaCartao] = await Promise.all([
    getSessaoAdmin(),
    pool.query<Administrador>('SELECT * FROM "ADMINISTRADORES" ORDER BY ts_criacao ASC'),
    obterTaxaCartao(),
  ]);

  return (
    <ConfiguracoesClient
      administradores={administradores}
      cdAdministradorAtual={sessao?.cd_administrador ?? null}
      papelAtual={sessao?.tp_papel ?? "ADMIN"}
      taxaCartaoInicial={taxaCartao}
    />
  );
}
