"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function gerarCodigo() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function usuarioAutenticado() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Você precisa estar logado.");
  return { supabase, user };
}

export async function gerarCodigoVinculacao() {
  const { supabase, user } = await usuarioAutenticado();

  // Limpa códigos antigos desse usuário antes de gerar um novo
  await supabase.from("VINCULACOES_TELEGRAM").delete().eq("cd_usuario_auth", user.id);

  const cd_codigo = gerarCodigo();
  const ts_expiracao = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error } = await supabase.from("VINCULACOES_TELEGRAM").insert({
    cd_usuario_auth: user.id,
    cd_codigo,
    ts_expiracao,
  });

  if (error) throw new Error(error.message);

  return { codigo: cd_codigo, expiraEm: ts_expiracao };
}

export async function verificarVinculacao() {
  const { supabase, user } = await usuarioAutenticado();

  const { data: vinculacao } = await supabase
    .from("VINCULACOES_TELEGRAM")
    .select("*")
    .eq("cd_usuario_auth", user.id)
    .order("ts_criacao", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!vinculacao) {
    return { status: "nenhum" as const };
  }

  if (new Date(vinculacao.ts_expiracao) < new Date() && vinculacao.tp_status === "PENDENTE") {
    await supabase.from("VINCULACOES_TELEGRAM").delete().eq("cd_vinculacao", vinculacao.cd_vinculacao);
    return { status: "expirado" as const };
  }

  if (vinculacao.tp_status === "PENDENTE") {
    return { status: "pendente" as const };
  }

  // CONFIRMADO: consome o código e grava o nr_id_telegram no perfil do usuário
  const { error: erroUpdate } = await supabase.auth.updateUser({
    data: { nr_id_telegram: vinculacao.nr_id_telegram },
  });
  if (erroUpdate) throw new Error(erroUpdate.message);

  await supabase.from("VINCULACOES_TELEGRAM").delete().eq("cd_vinculacao", vinculacao.cd_vinculacao);

  revalidatePath("/conta");
  return { status: "confirmado" as const, nr_id_telegram: vinculacao.nr_id_telegram };
}

export async function desvincularTelegram() {
  const { supabase } = await usuarioAutenticado();

  const { error } = await supabase.auth.updateUser({
    data: { nr_id_telegram: null },
  });
  if (error) throw new Error(error.message);

  revalidatePath("/conta");
}
