"use server";

import crypto from "crypto";
import { headers } from "next/headers";
import { pool } from "@/lib/db";
import { enviarEmailRecuperacaoSenha } from "@/lib/email";
import type { Usuario } from "@/types/database";

export async function solicitarRecuperacaoSenha(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    throw new Error("Informe um endereço de e-mail válido.");
  }

  const { rows } = await pool.query<Pick<Usuario, "cd_usuario" | "nm_nome" | "nm_email">>(
    'SELECT cd_usuario, nm_nome, nm_email FROM "USUARIOS" WHERE nm_email = $1 LIMIT 1',
    [email]
  );

  const usuario = rows[0];

  const mensagemPadrao =
    "Se o e-mail estiver cadastrado em nossa plataforma, enviamos um link para redefinição de senha. Verifique sua caixa de entrada e spam.";

  if (!usuario) {
    return { sucesso: true, mensagem: mensagemPadrao };
  }

  // Desativa tokens anteriores não utilizados
  await pool.query(
    'UPDATE "RECUPERACAO_SENHA" SET sn_utilizado = true WHERE cd_usuario = $1 AND sn_utilizado = false',
    [usuario.cd_usuario]
  );

  // Gera token seguro e data de expiração (1 hora)
  const token = crypto.randomBytes(32).toString("hex");
  const expiracao = new Date(Date.now() + 60 * 60 * 1000);

  await pool.query(
    'INSERT INTO "RECUPERACAO_SENHA" (cd_usuario, ds_token, ts_expiracao) VALUES ($1, $2, $3)',
    [usuario.cd_usuario, token, expiracao.toISOString()]
  );

  // Determinar URL base da aplicação
  const reqHeaders = await headers();
  const host = reqHeaders.get("host") || "localhost:3000";
  const protocol = reqHeaders.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

  const linkRecuperacao = `${baseUrl}/redefinir-senha?token=${token}`;

  const { linkDev } = await enviarEmailRecuperacaoSenha({
    para: usuario.nm_email,
    nome: usuario.nm_nome,
    linkRecuperacao,
  });

  return {
    sucesso: true,
    mensagem: mensagemPadrao,
    linkDev,
  };
}
