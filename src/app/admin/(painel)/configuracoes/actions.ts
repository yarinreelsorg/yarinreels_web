"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSessaoAdmin } from "@/lib/admin-auth";
import { registrarLog } from "@/lib/auditoria";
import type { TpPapelAdmin } from "@/types/database";

async function exigirSuperAdmin() {
  const sessao = await getSessaoAdmin();
  if (!sessao || sessao.tp_papel !== "SUPER_ADMIN") {
    throw new Error("Apenas super administradores podem gerenciar acessos.");
  }
  return sessao;
}

export async function criarAdministrador(formData: FormData) {
  await exigirSuperAdmin();

  const nm_nome = String(formData.get("nm_nome") ?? "").trim();
  const nm_email = String(formData.get("nm_email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  const tp_papel = (formData.get("tp_papel") as TpPapelAdmin) ?? "ADMIN";

  if (!nm_nome || !nm_email || senha.length < 8) {
    throw new Error("Preencha nome, e-mail e uma senha com pelo menos 8 caracteres.");
  }

  const supabase = createSupabaseAdminClient();
  const ds_senha_hash = await bcrypt.hash(senha, 10);

  const { data, error } = await supabase
    .from("ADMINISTRADORES")
    .insert({ nm_nome, nm_email, ds_senha_hash, tp_papel })
    .select("cd_administrador")
    .single();

  if (error) {
    throw new Error(
      error.code === "23505" ? "Já existe um administrador com esse e-mail." : error.message
    );
  }

  await registrarLog({
    tp_acao: "CRIACAO",
    nm_entidade: "ADMINISTRADORES",
    cd_entidade: data.cd_administrador,
    ds_detalhes: { nome: nm_nome, email: nm_email, papel: tp_papel },
  });

  revalidatePath("/admin/configuracoes");
}

export async function alternarAtivoAdministrador(cd_administrador: string, ativo: boolean) {
  const sessao = await exigirSuperAdmin();

  if (sessao.cd_administrador === cd_administrador) {
    throw new Error("Você não pode desativar a própria conta.");
  }

  const supabase = createSupabaseAdminClient();

  if (!ativo) {
    const { count } = await supabase
      .from("ADMINISTRADORES")
      .select("*", { count: "exact", head: true })
      .eq("tp_papel", "SUPER_ADMIN")
      .eq("sn_ativo", true);

    const { data: alvo } = await supabase
      .from("ADMINISTRADORES")
      .select("tp_papel")
      .eq("cd_administrador", cd_administrador)
      .maybeSingle();

    if (alvo?.tp_papel === "SUPER_ADMIN" && (count ?? 0) <= 1) {
      throw new Error("Não é possível desativar o único super administrador ativo.");
    }
  }

  const { error } = await supabase
    .from("ADMINISTRADORES")
    .update({ sn_ativo: ativo })
    .eq("cd_administrador", cd_administrador);

  if (error) throw new Error(error.message);

  await registrarLog({
    tp_acao: "ALTERACAO_STATUS",
    nm_entidade: "ADMINISTRADORES",
    cd_entidade: cd_administrador,
    ds_detalhes: { sn_ativo: ativo },
  });

  revalidatePath("/admin/configuracoes");
}

export async function atualizarTaxaCartao(formData: FormData) {
  await exigirSuperAdmin();

  const vl_taxa_cartao = Number(formData.get("vl_taxa_cartao"));
  if (Number.isNaN(vl_taxa_cartao) || vl_taxa_cartao < 0) {
    throw new Error("Informe um valor de taxa válido.");
  }

  const supabase = createSupabaseAdminClient();
  const { data: existente } = await supabase
    .from("CONFIGURACAO_PAGAMENTO")
    .select("cd_configuracao")
    .limit(1)
    .maybeSingle();

  const { error } = existente
    ? await supabase
        .from("CONFIGURACAO_PAGAMENTO")
        .update({ vl_taxa_cartao })
        .eq("cd_configuracao", existente.cd_configuracao)
    : await supabase.from("CONFIGURACAO_PAGAMENTO").insert({
        cd_configuracao: crypto.randomUUID(),
        vl_taxa_cartao,
        ts_atualizacao: new Date().toISOString(),
      });

  if (error) throw new Error(error.message);

  await registrarLog({
    tp_acao: "ALTERACAO_CONFIGURACAO",
    nm_entidade: "CONFIGURACAO_PAGAMENTO",
    ds_detalhes: { vl_taxa_cartao },
  });

  revalidatePath("/admin/configuracoes");
  revalidatePath("/checkout");
}

export async function atualizarPapelAdministrador(
  cd_administrador: string,
  tp_papel: TpPapelAdmin
) {
  const sessao = await exigirSuperAdmin();

  if (sessao.cd_administrador === cd_administrador && tp_papel !== "SUPER_ADMIN") {
    throw new Error("Você não pode rebaixar a própria conta.");
  }

  const supabase = createSupabaseAdminClient();

  if (tp_papel === "ADMIN") {
    const { count } = await supabase
      .from("ADMINISTRADORES")
      .select("*", { count: "exact", head: true })
      .eq("tp_papel", "SUPER_ADMIN")
      .eq("sn_ativo", true);

    const { data: alvo } = await supabase
      .from("ADMINISTRADORES")
      .select("tp_papel")
      .eq("cd_administrador", cd_administrador)
      .maybeSingle();

    if (alvo?.tp_papel === "SUPER_ADMIN" && (count ?? 0) <= 1) {
      throw new Error("Não é possível rebaixar o único super administrador ativo.");
    }
  }

  const { error } = await supabase
    .from("ADMINISTRADORES")
    .update({ tp_papel })
    .eq("cd_administrador", cd_administrador);

  if (error) throw new Error(error.message);

  await registrarLog({
    tp_acao: "ALTERACAO_PAPEL",
    nm_entidade: "ADMINISTRADORES",
    cd_entidade: cd_administrador,
    ds_detalhes: { tp_papel },
  });

  revalidatePath("/admin/configuracoes");
}
