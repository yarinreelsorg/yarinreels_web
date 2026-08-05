"use server";

import { revalidatePath } from "next/cache";
import { pool } from "@/lib/db";
import { DIAS_ALUGUEL, DIAS_VITALICIO, obterIdentidadeParaCompra, somarDias } from "@/lib/acesso";
import { registrarLog } from "@/lib/auditoria";
import type { ClienteResumo, TpCompra, Venda } from "@/types/database";

export async function buscarVendasCliente(nrIdTelegram: number): Promise<Venda[]> {
  const { rows } = await pool.query<Venda>(
    'SELECT * FROM "VENDAS" WHERE nr_id_telegram = $1 ORDER BY ts_criacao DESC',
    [nrIdTelegram]
  );
  return rows;
}

/** Busca o ID a usar pra conceder acesso a partir do e-mail de um usuário do site. */
export async function resolverIdentidadePorEmail(email: string): Promise<number | null> {
  const { rows } = await pool.query<{ cd_usuario: string }>(
    'SELECT cd_usuario FROM "USUARIOS" WHERE nm_email = $1 LIMIT 1',
    [email.trim().toLowerCase()]
  );
  if (!rows[0]) return null;
  return obterIdentidadeParaCompra(rows[0].cd_usuario);
}

export async function concederAcesso(formData: FormData, forcar = false) {
  const emailUsuario = String(formData.get("nm_email_usuario") ?? "").trim();
  let nr_id_telegram = Number(formData.get("nr_id_telegram"));

  if (emailUsuario) {
    const idResolvido = await resolverIdentidadePorEmail(emailUsuario);
    if (!idResolvido) {
      throw new Error("Nenhum usuário do site encontrado com esse e-mail.");
    }
    nr_id_telegram = idResolvido;
  }

  const tp_compra = formData.get("tp_compra") as TpCompra;
  const cd_conteudo = String(formData.get("cd_conteudo") ?? "").trim() || null;
  const cd_plano = String(formData.get("cd_plano") ?? "").trim() || null;

  if (!nr_id_telegram || Number.isNaN(nr_id_telegram)) {
    throw new Error("Informe um ID do Telegram válido ou o e-mail de um usuário do site.");
  }
  if (!tp_compra) {
    throw new Error("Selecione o tipo de acesso.");
  }

  let ts_expiracao: string;

  if (tp_compra === "ALUGUEL") {
    if (!cd_conteudo) throw new Error("Selecione o conteúdo para liberar o aluguel.");
    ts_expiracao = somarDias(DIAS_ALUGUEL);
  } else if (tp_compra === "VITALICIO") {
    if (!cd_conteudo) throw new Error("Selecione o conteúdo para liberar o acesso vitalício.");
    ts_expiracao = somarDias(DIAS_VITALICIO);
  } else if (tp_compra === "ASSINATURA") {
    if (!cd_plano) throw new Error("Selecione o plano de assinatura.");
    const { rows: planos } = await pool.query<{ nr_dias_validade: number }>(
      'SELECT nr_dias_validade FROM "PLANOS" WHERE cd_plano = $1 LIMIT 1',
      [cd_plano]
    );
    if (!planos[0]) throw new Error("Plano não encontrado.");
    ts_expiracao = somarDias(planos[0].nr_dias_validade);
  } else {
    throw new Error("Tipo de acesso inválido.");
  }

  if (!forcar) {
    const agoraIso = new Date().toISOString();
    const colunaItem = tp_compra === "ASSINATURA" ? "cd_plano" : "cd_conteudo";
    const valorItem = tp_compra === "ASSINATURA" ? cd_plano : cd_conteudo;

    const { rows: existentes } = await pool.query<{ ts_expiracao: string }>(
      `SELECT ts_expiracao FROM "VENDAS"
       WHERE nr_id_telegram = $1 AND tp_compra = $2 AND tp_status = 'APROVADA'
         AND ts_expiracao > $3 AND ${colunaItem} = $4
       ORDER BY ts_expiracao DESC LIMIT 1`,
      [nr_id_telegram, tp_compra, agoraIso, valorItem]
    );

    if (existentes[0]?.ts_expiracao) {
      const dataFormatada = new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(existentes[0].ts_expiracao));
      throw new Error(
        `DUPLICADO: Este cliente já tem acesso ativo a isso até ${dataFormatada}.`
      );
    }
  }

  await pool.query(
    `INSERT INTO "VENDAS" (nr_id_telegram, tp_compra, tp_status, cd_conteudo, cd_plano, ts_expiracao)
     VALUES ($1, $2, 'APROVADA', $3, $4, $5)`,
    [
      nr_id_telegram,
      tp_compra,
      tp_compra === "ASSINATURA" ? null : cd_conteudo,
      tp_compra === "ASSINATURA" ? cd_plano : null,
      ts_expiracao,
    ]
  );

  await registrarLog({
    tp_acao: "CONCESSAO_ACESSO",
    nm_entidade: "VENDAS",
    ds_detalhes: { nr_id_telegram, tp_compra, cd_conteudo, cd_plano, ts_expiracao },
  });

  revalidatePath("/admin/clientes");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/financeiro");
}

export async function buscarUltimaVisita(nrIdTelegram: number) {
  const { rows } = await pool.query<{ ds_dispositivo: string | null; ds_ip: string | null; ts_criacao: string }>(
    'SELECT ds_dispositivo, ds_ip, ts_criacao FROM "VISITAS" WHERE nr_id_telegram = $1 ORDER BY ts_criacao DESC LIMIT 1',
    [nrIdTelegram]
  );
  return rows[0] ?? null;
}

export async function verificarBanido(nrIdTelegram: number): Promise<boolean> {
  const { rows } = await pool.query<{ total: string }>(
    'SELECT COUNT(*) AS total FROM "BANS" WHERE nr_id_telegram = $1',
    [String(nrIdTelegram)]
  );
  return Number(rows[0]?.total ?? 0) > 0;
}

export async function banirCliente(nrIdTelegram: number) {
  try {
    await pool.query('INSERT INTO "BANS" (nr_id_telegram) VALUES ($1)', [String(nrIdTelegram)]);
  } catch (err) {
    if (!(err && typeof err === "object" && "code" in err && err.code === "23505")) {
      throw err;
    }
  }

  await registrarLog({
    tp_acao: "BANIMENTO",
    nm_entidade: "BANS",
    cd_entidade: String(nrIdTelegram),
  });

  revalidatePath("/admin/clientes");
}

export async function desbanirCliente(nrIdTelegram: number) {
  await pool.query('DELETE FROM "BANS" WHERE nr_id_telegram = $1', [String(nrIdTelegram)]);

  await registrarLog({
    tp_acao: "DESBANIMENTO",
    nm_entidade: "BANS",
    cd_entidade: String(nrIdTelegram),
  });

  revalidatePath("/admin/clientes");
}

/** Revoga uma venda aprovada antes do prazo — expira ela imediatamente. */
export async function revogarAcesso(cdVenda: string) {
  await pool.query('UPDATE "VENDAS" SET ts_expiracao = now() WHERE cd_venda = $1', [cdVenda]);

  await registrarLog({
    tp_acao: "REVOGACAO_ACESSO",
    nm_entidade: "VENDAS",
    cd_entidade: cdVenda,
  });

  revalidatePath("/admin/clientes");
  revalidatePath("/admin/dashboard");
}

export async function exportarClientesCsv(busca?: string): Promise<string> {
  const valores: unknown[] = [];
  const whereSql = busca
    ? (() => {
        valores.push(`%${busca}%`);
        return `WHERE id_telegram_texto ILIKE $${valores.length}`;
      })()
    : "";

  const { rows } = await pool.query<ClienteResumo>(
    `SELECT * FROM vw_clientes ${whereSql} ORDER BY ultima_compra DESC`,
    valores
  );

  const { paraCsv } = await import("@/lib/csv");
  return paraCsv(rows, [
    { chave: "nr_id_telegram", rotulo: "ID Telegram" },
    { chave: "total_compras", rotulo: "Total de Compras" },
    { chave: "ultima_compra", rotulo: "Última Compra" },
    { chave: "tipos_acesso", rotulo: "Tipos de Acesso" },
  ]);
}
