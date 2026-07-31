"use server";

import { pool } from "@/lib/db";
import { registrarLog } from "@/lib/auditoria";
import { revalidatePath } from "next/cache";
import type { Plano } from "@/types/database";

const parseNumber = (val: unknown) => {
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

function extrairCampos(formData: FormData) {
  const nm_plano = String(formData.get("nm_plano") ?? "").trim();
  const nm_categoria = String(formData.get("nm_categoria") ?? "").trim();
  const vl_plano = parseNumber(formData.get("vl_plano"));
  const nr_dias_validade = parseNumber(formData.get("nr_dias_validade"));

  if (!nm_plano || !nm_categoria) {
    throw new Error("Preencha nome e categoria do plano.");
  }
  if (vl_plano <= 0 || nr_dias_validade <= 0) {
    throw new Error("Valor e dias de validade devem ser maiores que zero.");
  }

  return { nm_plano, nm_categoria, vl_plano, nr_dias_validade };
}

export async function criarPlano(formData: FormData) {
  const campos = extrairCampos(formData);

  const { rows } = await pool.query<{ cd_plano: string }>(
    `INSERT INTO "PLANOS" (nm_plano, nm_categoria, vl_plano, nr_dias_validade)
     VALUES ($1, $2, $3, $4) RETURNING cd_plano`,
    [campos.nm_plano, campos.nm_categoria, campos.vl_plano, campos.nr_dias_validade]
  );

  await registrarLog({
    tp_acao: "CRIACAO",
    nm_entidade: "PLANOS",
    cd_entidade: rows[0].cd_plano,
    ds_detalhes: { nome: campos.nm_plano },
  });

  revalidatePath("/admin/planos");
  revalidatePath("/assinaturas");
}

export async function editarPlano(id: string, formData: FormData) {
  const campos = extrairCampos(formData);

  await pool.query(
    `UPDATE "PLANOS" SET nm_plano = $1, nm_categoria = $2, vl_plano = $3, nr_dias_validade = $4
     WHERE cd_plano = $5`,
    [campos.nm_plano, campos.nm_categoria, campos.vl_plano, campos.nr_dias_validade, id]
  );

  await registrarLog({
    tp_acao: "EDICAO",
    nm_entidade: "PLANOS",
    cd_entidade: id,
    ds_detalhes: { nome: campos.nm_plano },
  });

  revalidatePath("/admin/planos");
  revalidatePath("/assinaturas");
}

export async function removerPlano(id: string) {
  const { rows } = await pool.query<Plano>('SELECT * FROM "PLANOS" WHERE cd_plano = $1 LIMIT 1', [id]);
  const registro = rows[0];

  await pool.query('DELETE FROM "PLANOS" WHERE cd_plano = $1', [id]);

  if (registro) {
    await registrarLog({
      tp_acao: "EXCLUSAO",
      nm_entidade: "PLANOS",
      cd_entidade: id,
      ds_detalhes: { ...registro },
    });
  }

  revalidatePath("/admin/planos");
  revalidatePath("/assinaturas");
}

export async function restaurarPlano(snapshot: Plano) {
  await pool.query(
    `INSERT INTO "PLANOS" (cd_plano, nm_plano, nm_categoria, vl_plano, nr_dias_validade)
     VALUES ($1, $2, $3, $4, $5)`,
    [snapshot.cd_plano, snapshot.nm_plano, snapshot.nm_categoria, snapshot.vl_plano, snapshot.nr_dias_validade]
  );

  await registrarLog({
    tp_acao: "RESTAURACAO",
    nm_entidade: "PLANOS",
    cd_entidade: snapshot.cd_plano,
    ds_detalhes: { nome: snapshot.nm_plano },
  });

  revalidatePath("/admin/planos");
  revalidatePath("/admin/auditoria");
  revalidatePath("/assinaturas");
}
