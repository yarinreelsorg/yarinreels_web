"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { put } from "@vercel/blob";
import { pool } from "@/lib/db";
import { getSessaoAdmin } from "@/lib/admin-auth";
import { registrarLog } from "@/lib/auditoria";
import { renomearCategoria, salvarConfigCategorias } from "@/lib/categorias-config";
import { salvarLogoSite } from "@/lib/site-config";
import type { TpPapelAdmin } from "@/types/database";

async function exigirSuperAdmin() {
  const sessao = await getSessaoAdmin();
  if (!sessao || sessao.tp_papel !== "SUPER_ADMIN") {
    throw new Error("Apenas super administradores podem gerenciar acessos.");
  }
  return sessao;
}

const TAMANHO_MAXIMO_LOGO = 2 * 1024 * 1024; // 2MB
const TIPOS_ACEITOS_LOGO = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif"];

export async function enviarLogoSite(formData: FormData): Promise<string> {
  await exigirSuperAdmin();

  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    throw new Error("Selecione um arquivo de imagem.");
  }
  if (!TIPOS_ACEITOS_LOGO.includes(arquivo.type)) {
    throw new Error("Formato não aceito. Use PNG, JPG, WEBP, SVG ou GIF.");
  }
  if (arquivo.size > TAMANHO_MAXIMO_LOGO) {
    throw new Error("Imagem muito grande — o limite é 2MB.");
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "Armazenamento não configurado — falta a variável BLOB_READ_WRITE_TOKEN (crie um Blob Store no painel da Vercel)."
    );
  }

  const extensao = arquivo.name.split(".").pop() || "png";
  const nomeArquivo = `site-logo/${crypto.randomUUID()}.${extensao}`;

  const blob = await put(nomeArquivo, arquivo, { access: "public" });
  return blob.url;
}

export async function atualizarLogoSite(url: string) {
  await exigirSuperAdmin();

  await salvarLogoSite(url.trim() || null);

  await registrarLog({
    tp_acao: "ALTERACAO_CONFIGURACAO",
    nm_entidade: "CONFIGURACAO_SITE",
    ds_detalhes: { ds_logo_url: url },
  });

  revalidatePath("/admin/configuracoes");
  revalidatePath("/", "layout");
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

  const ds_senha_hash = await bcrypt.hash(senha, 10);

  let cd_administrador: string;
  try {
    const { rows } = await pool.query<{ cd_administrador: string }>(
      `INSERT INTO "ADMINISTRADORES" (nm_nome, nm_email, ds_senha_hash, tp_papel)
       VALUES ($1, $2, $3, $4) RETURNING cd_administrador`,
      [nm_nome, nm_email, ds_senha_hash, tp_papel]
    );
    cd_administrador = rows[0].cd_administrador;
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      throw new Error("Já existe um administrador com esse e-mail.");
    }
    throw err;
  }

  await registrarLog({
    tp_acao: "CRIACAO",
    nm_entidade: "ADMINISTRADORES",
    cd_entidade: cd_administrador,
    ds_detalhes: { nome: nm_nome, email: nm_email, papel: tp_papel },
  });

  revalidatePath("/admin/configuracoes");
}

export async function alternarAtivoAdministrador(cd_administrador: string, ativo: boolean) {
  const sessao = await exigirSuperAdmin();

  if (sessao.cd_administrador === cd_administrador) {
    throw new Error("Você não pode desativar a própria conta.");
  }

  if (!ativo) {
    const [{ rows: contagem }, { rows: alvoRows }] = await Promise.all([
      pool.query<{ total: string }>(
        `SELECT COUNT(*) AS total FROM "ADMINISTRADORES" WHERE tp_papel = 'SUPER_ADMIN' AND sn_ativo = true`
      ),
      pool.query<{ tp_papel: TpPapelAdmin }>(
        'SELECT tp_papel FROM "ADMINISTRADORES" WHERE cd_administrador = $1 LIMIT 1',
        [cd_administrador]
      ),
    ]);

    if (alvoRows[0]?.tp_papel === "SUPER_ADMIN" && Number(contagem[0]?.total ?? 0) <= 1) {
      throw new Error("Não é possível desativar o único super administrador ativo.");
    }
  }

  await pool.query('UPDATE "ADMINISTRADORES" SET sn_ativo = $1 WHERE cd_administrador = $2', [
    ativo,
    cd_administrador,
  ]);

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

  const { rows: existente } = await pool.query<{ cd_configuracao: string }>(
    'SELECT cd_configuracao FROM "CONFIGURACAO_PAGAMENTO" LIMIT 1'
  );

  if (existente[0]) {
    await pool.query(
      'UPDATE "CONFIGURACAO_PAGAMENTO" SET vl_taxa_cartao = $1, ts_atualizacao = now() WHERE cd_configuracao = $2',
      [vl_taxa_cartao, existente[0].cd_configuracao]
    );
  } else {
    await pool.query(
      'INSERT INTO "CONFIGURACAO_PAGAMENTO" (cd_configuracao, vl_taxa_cartao, ts_atualizacao) VALUES ($1, $2, now())',
      [crypto.randomUUID(), vl_taxa_cartao]
    );
  }

  await registrarLog({
    tp_acao: "ALTERACAO_CONFIGURACAO",
    nm_entidade: "CONFIGURACAO_PAGAMENTO",
    ds_detalhes: { vl_taxa_cartao },
  });

  revalidatePath("/admin/configuracoes");
  revalidatePath("/checkout");
}

export async function atualizarOrdemCategorias(
  ordem: string[],
  ocultas: string[] = [],
  exclusivas: string[] = []
) {
  await exigirSuperAdmin();

  await salvarConfigCategorias(ordem, ocultas, exclusivas);

  await registrarLog({
    tp_acao: "ALTERACAO_CONFIGURACAO",
    nm_entidade: "CONFIGURACAO_CATEGORIAS",
    ds_detalhes: { ordem, ocultas, exclusivas },
  });

  revalidatePath("/admin/configuracoes");
  revalidatePath("/");
  revalidatePath("/catalogo");
}

export async function renomearCategoriaAction(nomeAntigo: string, nomeNovo: string) {
  await exigirSuperAdmin();

  const nomeLimpo = nomeNovo.trim();
  if (!nomeLimpo) throw new Error("O novo nome não pode ficar em branco.");

  await renomearCategoria(nomeAntigo, nomeLimpo);

  await registrarLog({
    tp_acao: "ALTERACAO_CONFIGURACAO",
    nm_entidade: "CONTEUDOS",
    ds_detalhes: { acao: "renomear_categoria", de: nomeAntigo, para: nomeLimpo },
  });

  revalidatePath("/admin/configuracoes");
  revalidatePath("/admin/catalogo");
  revalidatePath("/");
  revalidatePath("/catalogo");
}

export async function atualizarPapelAdministrador(
  cd_administrador: string,
  tp_papel: TpPapelAdmin
) {
  const sessao = await exigirSuperAdmin();

  if (sessao.cd_administrador === cd_administrador && tp_papel !== "SUPER_ADMIN") {
    throw new Error("Você não pode rebaixar a própria conta.");
  }

  if (tp_papel === "ADMIN") {
    const [{ rows: contagem }, { rows: alvoRows }] = await Promise.all([
      pool.query<{ total: string }>(
        `SELECT COUNT(*) AS total FROM "ADMINISTRADORES" WHERE tp_papel = 'SUPER_ADMIN' AND sn_ativo = true`
      ),
      pool.query<{ tp_papel: TpPapelAdmin }>(
        'SELECT tp_papel FROM "ADMINISTRADORES" WHERE cd_administrador = $1 LIMIT 1',
        [cd_administrador]
      ),
    ]);

    if (alvoRows[0]?.tp_papel === "SUPER_ADMIN" && Number(contagem[0]?.total ?? 0) <= 1) {
      throw new Error("Não é possível rebaixar o único super administrador ativo.");
    }
  }

  await pool.query('UPDATE "ADMINISTRADORES" SET tp_papel = $1 WHERE cd_administrador = $2', [
    tp_papel,
    cd_administrador,
  ]);

  await registrarLog({
    tp_acao: "ALTERACAO_PAPEL",
    nm_entidade: "ADMINISTRADORES",
    cd_entidade: cd_administrador,
    ds_detalhes: { tp_papel },
  });

  revalidatePath("/admin/configuracoes");
}
