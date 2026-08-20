"use server";

import { revalidatePath } from "next/cache";
import { getSessaoAdmin } from "@/lib/admin-auth";
import { registrarLog } from "@/lib/auditoria";
import { marcarComissoesComoPagas } from "@/lib/afiliados";

async function exigirSuperAdmin() {
  const sessao = await getSessaoAdmin();
  if (!sessao || sessao.tp_papel !== "SUPER_ADMIN") {
    throw new Error("Apenas super administradores podem gerenciar comissões.");
  }
  return sessao;
}

export async function marcarComissoesPagasAction(cdUsuarioAfiliado: string) {
  await exigirSuperAdmin();

  await marcarComissoesComoPagas(cdUsuarioAfiliado);

  await registrarLog({
    tp_acao: "ALTERACAO_CONFIGURACAO",
    nm_entidade: "VENDAS",
    ds_detalhes: { acao: "marcar_comissoes_pagas", cd_usuario_afiliado: cdUsuarioAfiliado },
  });

  revalidatePath("/admin/afiliados");
}
