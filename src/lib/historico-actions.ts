"use server";

import { revalidatePath } from "next/cache";
import { getSessaoUsuario } from "@/lib/user-auth";
import { registrarProgresso, removerHistorico } from "@/lib/historico";

export async function registrarProgressoAssistindo(
  cdConteudo: string,
  segundoAtual: number,
  duracaoTotal: number | null
) {
  const sessao = await getSessaoUsuario();
  if (!sessao) return;
  await registrarProgresso(sessao.cd_usuario, cdConteudo, segundoAtual, duracaoTotal);
}

export async function removerDoHistorico(cdConteudo: string) {
  const sessao = await getSessaoUsuario();
  if (!sessao) return;
  await removerHistorico(sessao.cd_usuario, cdConteudo);
  revalidatePath("/");
}
