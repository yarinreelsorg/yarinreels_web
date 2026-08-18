"use server";

import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";
import { definirCookieSessao } from "@/lib/user-auth";
import type { Usuario, RecuperacaoSenha } from "@/types/database";

export async function validarTokenRecuperacao(token: string) {
  if (!token) {
    return { valido: false, erro: "Token de redefinição não fornecido." };
  }

  const { rows } = await pool.query<
    Pick<RecuperacaoSenha, "cd_recuperacao" | "ts_expiracao" | "sn_utilizado"> & {
      nm_email: string;
    }
  >(
    `SELECT r.cd_recuperacao, r.ts_expiracao, r.sn_utilizado, u.nm_email
     FROM "RECUPERACAO_SENHA" r
     JOIN "USUARIOS" u ON r.cd_usuario = u.cd_usuario
     WHERE r.ds_token = $1
     LIMIT 1`,
    [token]
  );

  const registro = rows[0];

  if (!registro) {
    return { valido: false, erro: "Link de redefinição de senha inválido." };
  }

  if (registro.sn_utilizado) {
    return { valido: false, erro: "Este link de redefinição já foi utilizado." };
  }

  if (new Date(registro.ts_expiracao) < new Date()) {
    return { valido: false, erro: "Este link de redefinição de senha expirou." };
  }

  return { valido: true, email: registro.nm_email };
}

export async function redefinirSenha(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  const novaSenha = String(formData.get("nova_senha") ?? "");
  const confirmarSenha = String(formData.get("confirmar_senha") ?? "");

  if (!token) {
    throw new Error("Token de redefinição inválido.");
  }
  if (!novaSenha || !confirmarSenha) {
    throw new Error("Preencha todos os campos de senha.");
  }
  if (novaSenha !== confirmarSenha) {
    throw new Error("As senhas não coincidem.");
  }
  if (novaSenha.length < 6) {
    throw new Error("A senha deve ter pelo menos 6 caracteres.");
  }

  const { rows } = await pool.query<
    Pick<RecuperacaoSenha, "cd_recuperacao" | "cd_usuario" | "ts_expiracao" | "sn_utilizado"> &
      Usuario
  >(
    `SELECT r.cd_recuperacao, r.cd_usuario, r.ts_expiracao, r.sn_utilizado,
            u.cd_usuario, u.nm_email, u.nm_nome, u.nr_id_telegram, u.nr_id_telegram_web
     FROM "RECUPERACAO_SENHA" r
     JOIN "USUARIOS" u ON r.cd_usuario = u.cd_usuario
     WHERE r.ds_token = $1
     LIMIT 1`,
    [token]
  );

  const registro = rows[0];

  if (!registro || registro.sn_utilizado || new Date(registro.ts_expiracao) < new Date()) {
    throw new Error("Link de redefinição de senha inválido ou expirado.");
  }

  const hashNovaSenha = await bcrypt.hash(novaSenha, 10);

  // Atualiza senha do usuário
  await pool.query(
    'UPDATE "USUARIOS" SET ds_senha_hash = $1, ts_atualizacao = NOW() WHERE cd_usuario = $2',
    [hashNovaSenha, registro.cd_usuario]
  );

  // Marca token como utilizado
  await pool.query(
    'UPDATE "RECUPERACAO_SENHA" SET sn_utilizado = true WHERE cd_recuperacao = $1',
    [registro.cd_recuperacao]
  );

  // Loga o usuário criando cookie de sessão
  await definirCookieSessao({
    cd_usuario: registro.cd_usuario,
    nm_email: registro.nm_email,
    nm_nome: registro.nm_nome,
    nr_id_telegram: registro.nr_id_telegram,
    nr_id_telegram_web: registro.nr_id_telegram_web,
  });

  return { sucesso: true };
}
