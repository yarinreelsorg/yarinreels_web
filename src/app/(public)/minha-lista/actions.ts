"use server";

import { revalidatePath } from "next/cache";
import { pool } from "@/lib/db";
import { getSessaoUsuario } from "@/lib/user-auth";

export async function alternarFavorito(cd_conteudo: string) {
  const sessao = await getSessaoUsuario();
  if (!sessao) throw new Error("Você precisa estar logado.");

  const { rows } = await pool.query<{ cd_favorito: string }>(
    'SELECT cd_favorito FROM "LISTA_FAVORITOS" WHERE cd_usuario_auth = $1 AND cd_conteudo = $2 LIMIT 1',
    [sessao.cd_usuario, cd_conteudo]
  );
  const existente = rows[0];

  if (existente) {
    await pool.query('DELETE FROM "LISTA_FAVORITOS" WHERE cd_favorito = $1', [existente.cd_favorito]);
    revalidatePath("/minha-lista");
    return { favoritado: false };
  }

  await pool.query('INSERT INTO "LISTA_FAVORITOS" (cd_usuario_auth, cd_conteudo) VALUES ($1, $2)', [
    sessao.cd_usuario,
    cd_conteudo,
  ]);
  revalidatePath("/minha-lista");
  return { favoritado: true };
}
