"use server";

import fs from "fs";
import path from "path";
import { pool } from "@/lib/db";

export interface AvatarAdmin {
  cd_avatar: string;
  nm_avatar: string;
  nm_categoria: string;
  ds_url_foto: string;
  nr_ordem: number;
  fl_ativo: boolean;
  ts_criacao: string;
}

export async function listarAvataresAdmin(): Promise<AvatarAdmin[]> {
  const { rows } = await pool.query<AvatarAdmin>(
    `SELECT * FROM "AVATARES" ORDER BY nr_ordem ASC, ts_criacao DESC`
  );
  return rows;
}

export async function salvarAvatarAdmin(formData: FormData): Promise<AvatarAdmin> {
  const cd_avatar = formData.get("cd_avatar") as string | null;
  const nm_avatar = (formData.get("nm_avatar") as string)?.trim();
  const nm_categoria = (formData.get("nm_categoria") as string)?.trim();
  const ds_url_foto_input = (formData.get("ds_url_foto") as string)?.trim();
  const nr_ordem = parseInt((formData.get("nr_ordem") as string) || "0", 10);
  const fl_ativo = formData.get("fl_ativo") !== "false";

  if (!nm_avatar || !nm_categoria) {
    throw new Error("Nome e categoria são obrigatórios.");
  }

  let ds_url_foto = ds_url_foto_input || "";

  // Processamento de Upload de Imagem
  const arquivo = formData.get("arquivo") as File | null;
  if (arquivo && arquivo.size > 0 && arquivo.name) {
    const bytes = await arquivo.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public/avatares/uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(arquivo.name) || ".png";
    const nomeArquivo = `avatar_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    const caminhoCompleto = path.join(uploadsDir, nomeArquivo);

    fs.writeFileSync(caminhoCompleto, buffer);
    ds_url_foto = `/avatares/uploads/${nomeArquivo}`;
  }

  if (!ds_url_foto) {
    throw new Error("Selecione um arquivo de imagem para upload ou forneça uma URL.");
  }

  if (cd_avatar) {
    const { rows } = await pool.query<AvatarAdmin>(
      `UPDATE "AVATARES"
       SET nm_avatar = $1, nm_categoria = $2, ds_url_foto = $3, nr_ordem = $4, fl_ativo = $5
       WHERE cd_avatar = $6
       RETURNING *`,
      [nm_avatar, nm_categoria, ds_url_foto, nr_ordem, fl_ativo, cd_avatar]
    );
    return rows[0];
  }

  const { rows } = await pool.query<AvatarAdmin>(
    `INSERT INTO "AVATARES" (nm_avatar, nm_categoria, ds_url_foto, nr_ordem, fl_ativo)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [nm_avatar, nm_categoria, ds_url_foto, nr_ordem, fl_ativo]
  );
  return rows[0];
}

export async function excluirAvatarAdmin(cd_avatar: string): Promise<void> {
  await pool.query('DELETE FROM "AVATARES" WHERE cd_avatar = $1', [cd_avatar]);
}

export async function alternarStatusAvatarAdmin(cd_avatar: string, fl_ativo: boolean): Promise<void> {
  await pool.query('UPDATE "AVATARES" SET fl_ativo = $1 WHERE cd_avatar = $2', [fl_ativo, cd_avatar]);
}
