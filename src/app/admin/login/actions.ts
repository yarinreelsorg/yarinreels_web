"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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

  const supabase = createSupabaseAdminClient();
  const { data: admin } = await supabase
    .from("ADMINISTRADORES")
    .select("*")
    .eq("nm_email", email)
    .maybeSingle();

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

  await supabase
    .from("ADMINISTRADORES")
    .update({ ts_ultimo_login: new Date().toISOString() })
    .eq("cd_administrador", admin.cd_administrador);

  redirect("/admin/dashboard");
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}
