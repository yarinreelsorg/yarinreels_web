"use server";

import { getSessaoUsuario, limparCookieSessao } from "@/lib/user-auth";

export async function obterUsuarioAtual() {
  const sessao = await getSessaoUsuario();
  if (!sessao) return null;
  return { nm_nome: sessao.nm_nome, nm_email: sessao.nm_email };
}

export async function sairUsuario() {
  await limparCookieSessao();
}
