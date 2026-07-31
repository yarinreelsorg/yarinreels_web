"use server";

import { pool } from "@/lib/db";
import { registrarLog } from "@/lib/auditoria";
import { revalidatePath } from "next/cache";

function extrairCampos(formData: FormData) {
  const nm_combo = String(formData.get("nm_combo") ?? "").trim();
  const vl_combo = Number(formData.get("vl_combo"));
  const cd_conteudos = formData.getAll("cd_conteudos").map(String);

  if (!nm_combo) throw new Error("Informe o nome do combo.");
  if (!vl_combo || vl_combo <= 0) throw new Error("Informe um valor de combo válido.");
  if (cd_conteudos.length < 2) throw new Error("Selecione ao menos 2 conteúdos para o combo.");

  return { nm_combo, vl_combo, cd_conteudos };
}

export async function criarCombo(formData: FormData) {
  const campos = extrairCampos(formData);

  const { rows } = await pool.query<{ cd_combo: string }>(
    `INSERT INTO "COMBOS_PROMOCIONAIS" (nm_combo, vl_combo, cd_conteudos)
     VALUES ($1, $2, $3::uuid[]) RETURNING cd_combo`,
    [campos.nm_combo, campos.vl_combo, campos.cd_conteudos]
  );

  await registrarLog({
    tp_acao: "CRIACAO",
    nm_entidade: "COMBOS_PROMOCIONAIS",
    cd_entidade: rows[0].cd_combo,
    ds_detalhes: { nome: campos.nm_combo },
  });

  revalidatePath("/admin/combos");
}

export async function editarCombo(id: string, formData: FormData) {
  const campos = extrairCampos(formData);

  await pool.query(
    `UPDATE "COMBOS_PROMOCIONAIS" SET nm_combo = $1, vl_combo = $2, cd_conteudos = $3::uuid[]
     WHERE cd_combo = $4`,
    [campos.nm_combo, campos.vl_combo, campos.cd_conteudos, id]
  );

  await registrarLog({
    tp_acao: "EDICAO",
    nm_entidade: "COMBOS_PROMOCIONAIS",
    cd_entidade: id,
    ds_detalhes: { nome: campos.nm_combo },
  });

  revalidatePath("/admin/combos");
}

export async function alternarAtivoCombo(id: string, ativo: boolean) {
  await pool.query('UPDATE "COMBOS_PROMOCIONAIS" SET sn_ativo = $1 WHERE cd_combo = $2', [ativo, id]);

  revalidatePath("/admin/combos");
}

export async function removerCombo(id: string) {
  await pool.query('DELETE FROM "COMBOS_PROMOCIONAIS" WHERE cd_combo = $1', [id]);

  await registrarLog({ tp_acao: "EXCLUSAO", nm_entidade: "COMBOS_PROMOCIONAIS", cd_entidade: id });

  revalidatePath("/admin/combos");
}
