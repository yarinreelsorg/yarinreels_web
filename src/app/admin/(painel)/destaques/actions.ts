"use server";

import { pool } from "@/lib/db";
import { revalidatePath } from "next/cache";

/** Define exatamente quais conteúdos entram no Carrossel de Destaque (Hero
 * da home) e em que ordem — substitui a seleção inteira a cada chamada. */
export async function definirCarrosselDestaque(idsEmOrdem: string[]) {
  await pool.query('UPDATE "CONTEUDOS" SET sn_destaque = false, nr_ordem_destaque = NULL');

  for (let i = 0; i < idsEmOrdem.length; i++) {
    await pool.query(
      'UPDATE "CONTEUDOS" SET sn_destaque = true, nr_ordem_destaque = $1 WHERE cd_conteudo = $2',
      [i, idsEmOrdem[i]]
    );
  }

  revalidatePath("/admin/destaques");
  revalidatePath("/");
}

/** Define exatamente quais conteúdos entram no Top 12 e em que ordem —
 * lista vazia volta pro ranking automático por nr_views. */
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
