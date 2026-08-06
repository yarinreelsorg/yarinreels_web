"use server";

import { pool } from "@/lib/db";
import { getSessaoUsuario, limparCookieSessao } from "@/lib/user-auth";

export async function obterUsuarioAtual() {
  const sessao = await getSessaoUsuario();
  if (!sessao) return null;

  const { rows } = await pool.query<{ ds_avatar: string | null }>(
    'SELECT ds_avatar FROM "USUARIOS" WHERE cd_usuario = $1 LIMIT 1',
    [sessao.cd_usuario]
  );

  return {
    nm_nome: sessao.nm_nome,
    nm_email: sessao.nm_email,
    ds_avatar: rows[0]?.ds_avatar ?? null,
  };
}

export async function sairUsuario() {
  await limparCookieSessao();
}
