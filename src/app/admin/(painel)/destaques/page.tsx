import { pool } from "@/lib/db";
import type { Conteudo } from "@/types/database";
import DestaquesAdminClient from "./DestaquesAdminClient";

export const revalidate = 0;

export default async function DestaquesAdminPage() {
  const [{ rows: conteudos }, { rows: config }] = await Promise.all([
    pool.query<Conteudo>('SELECT * FROM "CONTEUDOS" ORDER BY nm_titulo ASC'),
    pool.query<{ valor_config: string }>(
      'SELECT valor_config FROM "CONFIGURACOES" WHERE nome_config = $1 LIMIT 1',
      ["FOTO_START"]
    ),
  ]);

  return (
    <DestaquesAdminClient
      conteudos={conteudos}
      fotoStartAtual={config[0]?.valor_config ?? null}
    />
  );
}
