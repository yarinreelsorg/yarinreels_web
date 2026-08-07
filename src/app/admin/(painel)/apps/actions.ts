"use server";

import { revalidatePath } from "next/cache";
import { pool } from "@/lib/db";
import { getSessaoAdmin } from "@/lib/admin-auth";
import { registrarLog } from "@/lib/auditoria";

async function exigirSuperAdmin() {
  const sessao = await getSessaoAdmin();
  if (!sessao || sessao.tp_papel !== "SUPER_ADMIN") {
    throw new Error("Apenas super administradores podem gerenciar os apps.");
  }
  return sessao;
}

function revalidarTudo() {
  revalidatePath("/admin/apps");
  revalidatePath("/");
  revalidatePath("/catalogo");
}

export async function criarApp(nmApp: string, dsIcone: string) {
  await exigirSuperAdmin();

  const nome = nmApp.trim();
  if (!nome) throw new Error("Informe o nome do app.");

  const { rows: maxOrdem } = await pool.query<{ max: number | null }>(
    'SELECT MAX(nr_ordem) AS max FROM "APPS_NAVEGACAO"'
  );
  const proximaOrdem = (maxOrdem[0]?.max ?? -1) + 1;

  try {
    await pool.query(
      'INSERT INTO "APPS_NAVEGACAO" (nm_app, ds_icone, nr_ordem) VALUES ($1, $2, $3)',
      [nome, dsIcone.trim() || "▶️", proximaOrdem]
    );
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      throw new Error("Já existe um app com esse nome.");
    }
    throw err;
  }

  await registrarLog({ tp_acao: "CRIACAO", nm_entidade: "APPS_NAVEGACAO", ds_detalhes: { nome } });
  revalidarTudo();
}

export async function editarApp(cdApp: string, nmApp: string, dsIcone: string, nomeAntigo: string) {
  await exigirSuperAdmin();

  const nome = nmApp.trim();
  if (!nome) throw new Error("Informe o nome do app.");

  await pool.query('UPDATE "APPS_NAVEGACAO" SET nm_app = $1, ds_icone = $2 WHERE cd_app = $3', [
    nome,
    dsIcone.trim() || "▶️",
    cdApp,
  ]);

  // Se o nome mudou, atualiza também o que já foi marcado nos conteúdos —
  // senão o filtro por esse app para de bater com o conteúdo existente.
  if (nome !== nomeAntigo) {
    await pool.query('UPDATE "CONTEUDOS" SET nm_app_origem = $1 WHERE nm_app_origem = $2', [
      nome,
      nomeAntigo,
    ]);
  }

  await registrarLog({
    tp_acao: "EDICAO",
    nm_entidade: "APPS_NAVEGACAO",
    cd_entidade: cdApp,
    ds_detalhes: { de: nomeAntigo, para: nome },
  });
  revalidarTudo();
}

export async function removerApp(cdApp: string) {
  await exigirSuperAdmin();

  await pool.query('DELETE FROM "APPS_NAVEGACAO" WHERE cd_app = $1', [cdApp]);

  await registrarLog({ tp_acao: "EXCLUSAO", nm_entidade: "APPS_NAVEGACAO", cd_entidade: cdApp });
  revalidarTudo();
}

export async function alternarVisibilidadeApp(cdApp: string, visivel: boolean) {
  await exigirSuperAdmin();

  await pool.query('UPDATE "APPS_NAVEGACAO" SET sn_visivel = $1 WHERE cd_app = $2', [
    visivel,
    cdApp,
  ]);
  revalidarTudo();
}

export async function atualizarOrdemApps(ordem: string[]) {
  await exigirSuperAdmin();

  await Promise.all(
    ordem.map((cdApp, indice) =>
      pool.query('UPDATE "APPS_NAVEGACAO" SET nr_ordem = $1 WHERE cd_app = $2', [indice, cdApp])
    )
  );
  revalidarTudo();
}
