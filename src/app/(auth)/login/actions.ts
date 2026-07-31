"use server";

import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";
import { definirCookieSessao } from "@/lib/user-auth";
import type { Usuario } from "@/types/database";

export async function loginUsuario(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");

  if (!email || !senha) {
    throw new Error("Informe e-mail e senha.");
  }

  const { rows } = await pool.query<Usuario>(
    'SELECT * FROM "USUARIOS" WHERE nm_email = $1 LIMIT 1',
    [email]
  );
  const usuario = rows[0];

  if (!usuario) {
    throw new Error("E-mail ou senha inválidos.");
  }

  const senhaValida = await bcrypt.compare(senha, usuario.ds_senha_hash);
  if (!senhaValida) {
    throw new Error("E-mail ou senha inválidos.");
  }

  await definirCookieSessao({
    cd_usuario: usuario.cd_usuario,
    nm_email: usuario.nm_email,
    nm_nome: usuario.nm_nome,
    nr_id_telegram: usuario.nr_id_telegram,
    nr_id_telegram_web: usuario.nr_id_telegram_web,
  });
}
