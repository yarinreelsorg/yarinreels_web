"use server";

import { revalidatePath } from "next/cache";
import { getSessaoAdmin } from "@/lib/admin-auth";
import { registrarLog } from "@/lib/auditoria";
import { aplicarBlackFriday, encerrarBlackFriday } from "@/lib/black-friday";

type ResultadoAcao = { erro?: string; conteudos?: number; planos?: number };

// Teto de 90% de propósito: um "300" ou "95" digitado por engano zeraria os
// preços de todo o catálogo de uma vez.
const PERCENTUAL_MAXIMO = 90;

async function exigirAdmin() {
  const sessao = await getSessaoAdmin();
  if (!sessao) throw new Error("Sessão expirada. Entre novamente no painel.");
}

function atualizarPaginasPublicas() {
  revalidatePath("/admin/black-friday");
  revalidatePath("/admin/catalogo");
  revalidatePath("/", "layout");
}

export async function aplicarDescontoBlackFriday(
  percentual: number,
  incluirPlanos: boolean
): Promise<ResultadoAcao> {
  await exigirAdmin();

  if (!Number.isInteger(percentual) || percentual < 1 || percentual > PERCENTUAL_MAXIMO) {
    return { erro: `Informe um percentual inteiro entre 1 e ${PERCENTUAL_MAXIMO}.` };
  }

  const resultado = await aplicarBlackFriday(percentual, incluirPlanos);

  await registrarLog({
    tp_acao: "ALTERACAO_CONFIGURACAO",
    nm_entidade: "BLACK_FRIDAY",
    ds_detalhes: { acao: "APLICAR", percentual, incluirPlanos, ...resultado },
  });

  atualizarPaginasPublicas();
  return resultado;
}

export async function encerrarDescontoBlackFriday(): Promise<ResultadoAcao> {
  await exigirAdmin();

  const resultado = await encerrarBlackFriday();

  await registrarLog({
    tp_acao: "ALTERACAO_CONFIGURACAO",
    nm_entidade: "BLACK_FRIDAY",
    ds_detalhes: { acao: "ENCERRAR", ...resultado },
  });

  atualizarPaginasPublicas();
  return resultado;
}
