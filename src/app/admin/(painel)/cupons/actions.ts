"use server";

import { pool } from "@/lib/db";
import { registrarLog } from "@/lib/auditoria";
import { revalidatePath } from "next/cache";
import type { TpDesconto } from "@/types/database";

function extrairCampos(formData: FormData) {
  const cd_codigo = String(formData.get("cd_codigo") ?? "").trim().toUpperCase();
  const tp_desconto = formData.get("tp_desconto") as TpDesconto;
  const vl_desconto = Number(formData.get("vl_desconto"));
  const usosMaximoRaw = String(formData.get("nr_usos_maximo") ?? "").trim();
  const dataValidadeRaw = String(formData.get("dt_validade") ?? "").trim();

  if (!cd_codigo) throw new Error("Informe o código do cupom.");
  if (tp_desconto !== "PERCENTUAL" && tp_desconto !== "FIXO") {
    throw new Error("Selecione o tipo de desconto.");
  }
  if (!vl_desconto || vl_desconto <= 0) throw new Error("Informe um valor de desconto válido.");
  if (tp_desconto === "PERCENTUAL" && vl_desconto > 100) {
    throw new Error("Desconto percentual não pode passar de 100%.");
  }

  return {
    cd_codigo,
    tp_desconto,
    vl_desconto,
    nr_usos_maximo: usosMaximoRaw ? Number(usosMaximoRaw) : null,
    dt_validade: dataValidadeRaw || null,
  };
}

function ehViolacaoUnicidade(err: unknown): boolean {
  return !!(err && typeof err === "object" && "code" in err && err.code === "23505");
}

export async function criarCupom(formData: FormData) {
  const campos = extrairCampos(formData);

  let cd_cupom: string;
  try {
    const { rows } = await pool.query<{ cd_cupom: string }>(
      `INSERT INTO "CUPONS" (cd_codigo, tp_desconto, vl_desconto, nr_usos_maximo, dt_validade)
       VALUES ($1, $2, $3, $4, $5) RETURNING cd_cupom`,
      [campos.cd_codigo, campos.tp_desconto, campos.vl_desconto, campos.nr_usos_maximo, campos.dt_validade]
    );
    cd_cupom = rows[0].cd_cupom;
  } catch (err) {
    if (ehViolacaoUnicidade(err)) throw new Error("Já existe um cupom com esse código.");
    throw err;
  }

  await registrarLog({
    tp_acao: "CRIACAO",
    nm_entidade: "CUPONS",
    cd_entidade: cd_cupom,
    ds_detalhes: { codigo: campos.cd_codigo },
  });

  revalidatePath("/admin/cupons");
}

export async function editarCupom(id: string, formData: FormData) {
  const campos = extrairCampos(formData);

  try {
    await pool.query(
      `UPDATE "CUPONS" SET cd_codigo = $1, tp_desconto = $2, vl_desconto = $3, nr_usos_maximo = $4, dt_validade = $5
       WHERE cd_cupom = $6`,
      [campos.cd_codigo, campos.tp_desconto, campos.vl_desconto, campos.nr_usos_maximo, campos.dt_validade, id]
    );
  } catch (err) {
    if (ehViolacaoUnicidade(err)) throw new Error("Já existe um cupom com esse código.");
    throw err;
  }

  await registrarLog({
    tp_acao: "EDICAO",
    nm_entidade: "CUPONS",
    cd_entidade: id,
    ds_detalhes: { codigo: campos.cd_codigo },
  });

  revalidatePath("/admin/cupons");
}

export async function alternarAtivoCupom(id: string, ativo: boolean) {
  await pool.query('UPDATE "CUPONS" SET sn_ativo = $1 WHERE cd_cupom = $2', [ativo, id]);

  revalidatePath("/admin/cupons");
}

export async function removerCupom(id: string) {
  await pool.query('DELETE FROM "CUPONS" WHERE cd_cupom = $1', [id]);

  await registrarLog({ tp_acao: "EXCLUSAO", nm_entidade: "CUPONS", cd_entidade: id });

  revalidatePath("/admin/cupons");
}
