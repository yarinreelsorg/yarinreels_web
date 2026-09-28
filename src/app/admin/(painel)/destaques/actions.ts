"use server";

import { put } from "@vercel/blob";
import { pool } from "@/lib/db";
import { revalidatePath } from "next/cache";

/** Item do Carrossel de Destaque, com a flag que decide se ele também
 * entra no carrossel do bot Telegram (Melreels) — ver definirCarrosselDestaque. */
export type ItemCarrosselDestaque = { cd_conteudo: string; sincronizarBot: boolean };

/** Define exatamente quais conteúdos entram no Carrossel de Destaque (Hero
 * da home) e em que ordem — substitui a seleção inteira a cada chamada.
 * Também sincroniza com o carrossel do bot Telegram (Melreels): escreve a
 * mesma lista, na mesma ordem, em CONFIGURACOES.CARROSSEL_IDS — só que
 * filtrada aos itens com sincronizarBot=true, então dá pra excluir um
 * título específico do bot sem tirar ele do site nem mexer nos demais. */
export async function definirCarrosselDestaque(itens: ItemCarrosselDestaque[]) {
  await pool.query('UPDATE "CONTEUDOS" SET sn_destaque = false, nr_ordem_destaque = NULL');

  for (let i = 0; i < itens.length; i++) {
    await pool.query(
      `UPDATE "CONTEUDOS" SET sn_destaque = true, nr_ordem_destaque = $1, sn_incluir_carrossel_bot = $2
       WHERE cd_conteudo = $3`,
      [i, itens[i].sincronizarBot, itens[i].cd_conteudo]
    );
  }

  const idsParaBot = itens.filter((i) => i.sincronizarBot).map((i) => i.cd_conteudo);
  await sincronizarCarrosselBot(idsParaBot);

  revalidatePath("/admin/destaques");
  revalidatePath("/");
}

async function sincronizarCarrosselBot(idsEmOrdem: string[]) {
  const valor = idsEmOrdem.join(",");
  const { rows: existe } = await pool.query(
    'SELECT 1 FROM "CONFIGURACOES" WHERE nome_config = $1 LIMIT 1',
    ["CARROSSEL_IDS"]
  );
  if (existe.length > 0) {
    await pool.query('UPDATE "CONFIGURACOES" SET valor_config = $1 WHERE nome_config = $2', [
      valor,
      "CARROSSEL_IDS",
    ]);
  } else {
    await pool.query('INSERT INTO "CONFIGURACOES" (nome_config, valor_config) VALUES ($1, $2)', [
      "CARROSSEL_IDS",
      valor,
    ]);
  }
}

/** Foto de boas-vindas exibida no /start do bot Telegram — mesmo valor que
 * a Wizard Scene "ALTERAR_START_SCENE" do bot grava, só que editável por
 * aqui também agora. Aceita URL de imagem (o bot também aceita um
 * file_id nativo do Telegram enviado direto no chat — isso continua só
 * possível por lá, mas a foto trocada por qualquer um dos dois lados
 * vale pros dois, é a mesma linha no banco). */
export async function definirFotoStartBot(url: string) {
  const valor = url.trim();
  if (!valor) throw new Error("Informe a URL da imagem.");

  const { rows: existe } = await pool.query(
    'SELECT 1 FROM "CONFIGURACOES" WHERE nome_config = $1 LIMIT 1',
    ["FOTO_START"]
  );
  if (existe.length > 0) {
    await pool.query('UPDATE "CONFIGURACOES" SET valor_config = $1 WHERE nome_config = $2', [
      valor,
      "FOTO_START",
    ]);
  } else {
    await pool.query('INSERT INTO "CONFIGURACOES" (nome_config, valor_config) VALUES ($1, $2)', [
      "FOTO_START",
      valor,
    ]);
  }

  revalidatePath("/admin/destaques");
}

const TAMANHO_MAXIMO_FOTO_START = 5 * 1024 * 1024; // 5MB
const TIPOS_ACEITOS_FOTO_START = ["image/png", "image/jpeg", "image/webp", "image/gif"];

/** Envia o arquivo pro Blob da Vercel e devolve a URL pública — mesmo
 * padrão de src/app/admin/(painel)/apps/actions.ts (enviarLogoApp). */
export async function enviarFotoStartBot(formData: FormData): Promise<string> {
  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    throw new Error("Selecione um arquivo de imagem.");
  }
  if (!TIPOS_ACEITOS_FOTO_START.includes(arquivo.type)) {
    throw new Error("Formato não aceito. Use PNG, JPG, WEBP ou GIF.");
  }
  if (arquivo.size > TAMANHO_MAXIMO_FOTO_START) {
    throw new Error("Imagem muito grande — o limite é 5MB.");
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "Armazenamento não configurado — falta a variável BLOB_READ_WRITE_TOKEN (crie um Blob Store no painel da Vercel)."
    );
  }

  const extensao = arquivo.name.split(".").pop() || "jpg";
  const nomeArquivo = `foto-start-bot/${crypto.randomUUID()}.${extensao}`;

  const blob = await put(nomeArquivo, arquivo, { access: "public" });
  return blob.url;
}

/** Define exatamente quais conteúdos entram no Top 12 e em que ordem —
 * lista vazia volta pro ranking automático por nr_views. Sem equivalente
 * no bot (ele não tem conceito de "Top 12"), não sincroniza nada. */
export async function definirTop12(idsEmOrdem: string[]) {
  await pool.query('UPDATE "CONTEUDOS" SET sn_top12 = false, nr_ordem_top12 = NULL');

  for (let i = 0; i < idsEmOrdem.length; i++) {
    await pool.query(
      'UPDATE "CONTEUDOS" SET sn_top12 = true, nr_ordem_top12 = $1 WHERE cd_conteudo = $2',
      [i, idsEmOrdem[i]]
    );
  }

  revalidatePath("/admin/destaques");
  revalidatePath("/");
}
