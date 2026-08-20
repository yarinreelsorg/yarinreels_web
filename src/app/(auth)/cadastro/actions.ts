"use server";

import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";
import { definirCookieSessao } from "@/lib/user-auth";
import { vincularIndicacaoNoCadastro } from "@/lib/afiliados";

export async function cadastrarUsuario(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  const confirmarSenha = String(formData.get("confirmar_senha") ?? "");

  if (!nome || !email || !senha) {
    throw new Error("Preencha todos os campos.");
  }
  if (senha !== confirmarSenha) {
    throw new Error("As senhas não coincidem.");
  }
  if (senha.length < 6) {
    throw new Error("A senha deve ter pelo menos 6 caracteres.");
  }

  const ds_senha_hash = await bcrypt.hash(senha, 10);

  let cd_usuario: string;
  try {
    const { rows } = await pool.query<{ cd_usuario: string }>(
      'INSERT INTO "USUARIOS" (nm_email, ds_senha_hash, nm_nome) VALUES ($1, $2, $3) RETURNING cd_usuario',
      [email, ds_senha_hash, nome]
    );
    cd_usuario = rows[0].cd_usuario;
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      throw new Error("Já existe uma conta com esse e-mail.");
    }
    throw err;
  }

  await vincularIndicacaoNoCadastro(cd_usuario);

  await definirCookieSessao({
    cd_usuario,
    nm_email: email,
    nm_nome: nome,
    nr_id_telegram: null,
    nr_id_telegram_web: null,
  });
}
