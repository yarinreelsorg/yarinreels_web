"use server";

import { pool } from "@/lib/db";
import { registrarLog } from "@/lib/auditoria";
import { diasRestantes } from "@/lib/catalogo";
import { revalidatePath } from "next/cache";
import type { Plano } from "@/types/database";

const parseNumber = (val: unknown) => {
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

function extrairCampos(formData: FormData) {
  const nm_plano = String(formData.get("nm_plano") ?? "").trim();
  const nm_categoria = String(formData.get("nm_categoria") ?? "").trim();
  // Categorias extras vêm como vários campos "nm_categorias_adicionais"
  // (um por opção marcada no multi-select) — nunca digitadas à mão, então
  // não sofrem do mesmo risco de vírgula/typo que nm_categoria já sofreu.
  const nm_categorias_adicionais = formData
    .getAll("nm_categorias_adicionais")
    .map((v) => String(v).trim())
    .filter((v) => v && v !== nm_categoria);
  const vl_plano = parseNumber(formData.get("vl_plano"));
  const nr_dias_validade = parseNumber(formData.get("nr_dias_validade"));

  if (!nm_plano || !nm_categoria) {
    throw new Error("Preencha nome e categoria do plano.");
  }
  if (vl_plano <= 0 || nr_dias_validade <= 0) {
    throw new Error("Valor e dias de validade devem ser maiores que zero.");
  }

  return { nm_plano, nm_categoria, nm_categorias_adicionais, vl_plano, nr_dias_validade };
}

export async function criarPlano(formData: FormData) {
  const campos = extrairCampos(formData);

  const { rows } = await pool.query<{ cd_plano: string }>(
    `INSERT INTO "PLANOS" (nm_plano, nm_categoria, nm_categorias_adicionais, vl_plano, nr_dias_validade)
     VALUES ($1, $2, $3, $4, $5) RETURNING cd_plano`,
    [
      campos.nm_plano,
      campos.nm_categoria,
      campos.nm_categorias_adicionais,
      campos.vl_plano,
      campos.nr_dias_validade,
    ]
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
    `UPDATE "PLANOS" SET nm_plano = $1, nm_categoria = $2, nm_categorias_adicionais = $3,
       vl_plano = $4, nr_dias_validade = $5
     WHERE cd_plano = $6`,
    [
      campos.nm_plano,
      campos.nm_categoria,
      campos.nm_categorias_adicionais,
      campos.vl_plano,
      campos.nr_dias_validade,
      id,
    ]
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

/** Assinante com assinatura ATIVA (aprovada, ainda não expirada) nesse
 * plano — é quem precisa ser migrado antes do plano poder ser excluído,
 * senão perde o acesso que já pagou. */
export type AssinanteAtivo = {
  cd_venda: string;
  nr_id_telegram: number;
  ts_expiracao: string;
  dias_restantes: number;
  nm_email: string | null;
};

export async function listarAssinantesAtivos(cdPlano: string): Promise<AssinanteAtivo[]> {
  const agoraIso = new Date().toISOString();
  const { rows } = await pool.query<{
    cd_venda: string;
    nr_id_telegram: number;
    ts_expiracao: string;
  }>(
    `SELECT cd_venda, nr_id_telegram, ts_expiracao FROM "VENDAS"
     WHERE cd_plano = $1 AND tp_compra = 'ASSINATURA' AND tp_status = 'APROVADA' AND ts_expiracao > $2
     ORDER BY ts_expiracao ASC`,
    [cdPlano, agoraIso]
  );

  if (rows.length === 0) return [];

  const ids = Array.from(new Set(rows.map((r) => r.nr_id_telegram)));
  const { rows: usuarios } = await pool.query<{
    nr_id_telegram: number | null;
    nr_id_telegram_web: number | null;
    nm_email: string;
  }>(
    `SELECT nr_id_telegram, nr_id_telegram_web, nm_email FROM "USUARIOS"
     WHERE nr_id_telegram = ANY($1::bigint[]) OR nr_id_telegram_web = ANY($1::bigint[])`,
    [ids]
  );
  const emailPorId = new Map<number, string>();
  for (const u of usuarios) {
    for (const idTelegram of [u.nr_id_telegram, u.nr_id_telegram_web]) {
      if (idTelegram !== null) emailPorId.set(idTelegram, u.nm_email);
    }
  }

  return rows.map((r) => ({
    cd_venda: r.cd_venda,
    nr_id_telegram: r.nr_id_telegram,
    ts_expiracao: r.ts_expiracao,
    dias_restantes: diasRestantes(r.ts_expiracao),
    nm_email: emailPorId.get(r.nr_id_telegram) ?? null,
  }));
}

/** Move assinantes ativos de um plano pra outro (usado antes de excluir um
 * plano) — só troca a referência de plano, mantém a data de expiração
 * intacta (o cliente não perde nem ganha dias por causa da migração). */
export async function migrarAssinantes(
  cdPlanoOrigem: string,
  cdPlanoDestino: string,
  cdVendas: string[]
): Promise<number> {
  if (cdPlanoOrigem === cdPlanoDestino) {
    throw new Error("Escolha um plano diferente do atual para migrar os assinantes.");
  }
  if (cdVendas.length === 0) {
    throw new Error("Selecione ao menos um assinante para migrar.");
  }

  const { rows: destinoRows } = await pool.query<Plano>(
    'SELECT * FROM "PLANOS" WHERE cd_plano = $1 LIMIT 1',
    [cdPlanoDestino]
  );
  const destino = destinoRows[0];
  if (!destino) throw new Error("Plano de destino não encontrado.");

  const { rowCount } = await pool.query(
    `UPDATE "VENDAS" SET cd_plano = $1
     WHERE cd_plano = $2 AND cd_venda = ANY($3::uuid[])
       AND tp_compra = 'ASSINATURA' AND tp_status = 'APROVADA'`,
    [cdPlanoDestino, cdPlanoOrigem, cdVendas]
  );

  await registrarLog({
    tp_acao: "MIGRACAO",
    nm_entidade: "PLANOS",
    cd_entidade: cdPlanoOrigem,
    ds_detalhes: {
      planoDestino: destino.nm_plano,
      cdPlanoDestino,
      quantidade: rowCount ?? 0,
      cdVendas,
    },
  });

  revalidatePath("/admin/planos");
  revalidatePath("/admin/clientes");
  revalidatePath("/assinaturas");

  return rowCount ?? 0;
}

export async function removerPlano(id: string) {
  const agoraIso = new Date().toISOString();
  const { rows: ativos } = await pool.query<{ total: string }>(
    `SELECT COUNT(*) AS total FROM "VENDAS"
     WHERE cd_plano = $1 AND tp_compra = 'ASSINATURA' AND tp_status = 'APROVADA' AND ts_expiracao > $2`,
    [id, agoraIso]
  );
  if (Number(ativos[0]?.total ?? 0) > 0) {
    throw new Error(
      "Este plano ainda tem assinantes ativos. Migre-os para outro plano antes de excluir."
    );
  }

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
    `INSERT INTO "PLANOS" (cd_plano, nm_plano, nm_categoria, nm_categorias_adicionais, vl_plano, nr_dias_validade)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      snapshot.cd_plano,
      snapshot.nm_plano,
      snapshot.nm_categoria,
      snapshot.nm_categorias_adicionais ?? [],
      snapshot.vl_plano,
      snapshot.nr_dias_validade,
    ]
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
