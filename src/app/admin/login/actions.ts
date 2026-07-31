"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";
import type { Administrador } from "@/types/database";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  criarSessionToken,
} from "@/lib/admin-auth";

interface LoginResult {
  erro?: string;
}

export async function loginAdmin(
  _prevState: LoginResult,
  formData: FormData
): Promise<LoginResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");

  if (!email || !senha) {
    return { erro: "Informe e-mail e senha." };
  }

  const { rows } = await pool.query<Administrador>(
    'SELECT * FROM "ADMINISTRADORES" WHERE nm_email = $1 LIMIT 1',
    [email]
  );
  const admin = rows[0];

  if (!admin || !admin.sn_ativo) {
    return { erro: "E-mail ou senha inválidos." };
  }

  const senhaValida = await bcrypt.compare(senha, admin.ds_senha_hash);
  if (!senhaValida) {
    return { erro: "E-mail ou senha inválidos." };
  }

  const token = await criarSessionToken({
    cd_administrador: admin.cd_administrador,
    nm_email: admin.nm_email,
    nm_nome: admin.nm_nome,
    tp_papel: admin.tp_papel,
  });

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });

  await pool.query('UPDATE "ADMINISTRADORES" SET ts_ultimo_login = now() WHERE cd_administrador = $1', [
    admin.cd_administrador,
  ]);

  redirect("/admin/dashboard");
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}
