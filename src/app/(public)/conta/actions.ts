"use server";

import { revalidatePath } from "next/cache";
import { pool } from "@/lib/db";
import { definirCookieSessao, getSessaoUsuario } from "@/lib/user-auth";
import type { VinculacaoTelegram } from "@/types/database";

function gerarCodigo() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function usuarioAutenticado() {
  const sessao = await getSessaoUsuario();
  if (!sessao) throw new Error("Você precisa estar logado.");
  return sessao;
}

export async function gerarCodigoVinculacao() {
  const sessao = await usuarioAutenticado();

  // Limpa códigos antigos desse usuário antes de gerar um novo
  await pool.query('DELETE FROM "VINCULACOES_TELEGRAM" WHERE cd_usuario_auth = $1', [
    sessao.cd_usuario,
  ]);

  const cd_codigo = gerarCodigo();
  const ts_expiracao = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  await pool.query(
    'INSERT INTO "VINCULACOES_TELEGRAM" (cd_usuario_auth, cd_codigo, ts_expiracao) VALUES ($1, $2, $3)',
    [sessao.cd_usuario, cd_codigo, ts_expiracao]
  );

  return { codigo: cd_codigo, expiraEm: ts_expiracao };
}

export async function verificarVinculacao() {
  const sessao = await usuarioAutenticado();

  const { rows } = await pool.query<VinculacaoTelegram>(
    'SELECT * FROM "VINCULACOES_TELEGRAM" WHERE cd_usuario_auth = $1 ORDER BY ts_criacao DESC LIMIT 1',
    [sessao.cd_usuario]
  );
  const vinculacao = rows[0];

  if (!vinculacao) {
    return { status: "nenhum" as const };
  }

  if (new Date(vinculacao.ts_expiracao) < new Date() && vinculacao.tp_status === "PENDENTE") {
    await pool.query('DELETE FROM "VINCULACOES_TELEGRAM" WHERE cd_vinculacao = $1', [
      vinculacao.cd_vinculacao,
    ]);
    return { status: "expirado" as const };
  }

  if (vinculacao.tp_status === "PENDENTE") {
    return { status: "pendente" as const };
  }

  // CONFIRMADO: consome o código e grava o nr_id_telegram no perfil do usuário
  await pool.query('UPDATE "USUARIOS" SET nr_id_telegram = $1, ts_atualizacao = now() WHERE cd_usuario = $2', [
    vinculacao.nr_id_telegram,
    sessao.cd_usuario,
  ]);

  await pool.query('DELETE FROM "VINCULACOES_TELEGRAM" WHERE cd_vinculacao = $1', [
    vinculacao.cd_vinculacao,
  ]);

  await definirCookieSessao({ ...sessao, nr_id_telegram: vinculacao.nr_id_telegram });

  revalidatePath("/conta");
  return { status: "confirmado" as const, nr_id_telegram: vinculacao.nr_id_telegram };
}

/** avatar = null remove a foto/personagem escolhido, voltando pro ícone
 * neutro padrão (ver Avatar.tsx). */
export async function atualizarAvatar(avatar: string | null) {
  const sessao = await usuarioAutenticado();

  await pool.query('UPDATE "USUARIOS" SET ds_avatar = $1 WHERE cd_usuario = $2', [
    avatar,
    sessao.cd_usuario,
  ]);

  revalidatePath("/conta");
  revalidatePath("/admin/clientes");
  revalidatePath("/admin/usuarios");
}

export async function obterAvataresPublicos() {
  try {
    const { rows } = await pool.query<{
      cd_avatar: string;
      nm_avatar: string;
      nm_categoria: string;
      ds_url_foto: string;
    }>('SELECT * FROM "AVATARES" WHERE fl_ativo = true ORDER BY nr_ordem ASC, ts_criacao DESC');

    if (rows.length > 0) {
      return rows.map((r) => ({
        id: r.cd_avatar,
        nome: r.nm_avatar,
        categoria: r.nm_categoria,
        url: r.ds_url_foto,
      }));
    }
  } catch {}
  return [];
}

export async function obterVideoSuporteAction() {
  try {
    const { rows } = await pool.query<{ ds_url_video_suporte: string | null }>(
      'SELECT ds_url_video_suporte FROM "CONFIGURACAO_SITE" LIMIT 1'
    );
    return rows[0]?.ds_url_video_suporte ?? null;
  } catch {
    return null;
  }
}

export async function desvincularTelegram() {
  const sessao = await usuarioAutenticado();

  await pool.query('UPDATE "USUARIOS" SET nr_id_telegram = NULL, ts_atualizacao = now() WHERE cd_usuario = $1', [
    sessao.cd_usuario,
  ]);

  await definirCookieSessao({ ...sessao, nr_id_telegram: null });

  revalidatePath("/conta");
}
