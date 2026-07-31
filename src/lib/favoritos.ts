import "server-only";
import { pool } from "./db";

export async function obterIdsFavoritos(userId: string): Promise<Set<string>> {
  const { rows } = await pool.query<{ cd_conteudo: string }>(
    'SELECT cd_conteudo FROM "LISTA_FAVORITOS" WHERE cd_usuario_auth = $1',
    [userId]
  );
  return new Set(rows.map((f) => f.cd_conteudo));
}
