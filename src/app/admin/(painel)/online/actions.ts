"use server";

import { pool } from "@/lib/db";

export interface SessoesOnlineItem {
  nr_id_telegram: number;
  dispositivo: string;
  status: string;
  ultima_atividade: string;
  cd_conteudo: string | null;
  conteudo_titulo: string | null;
  conteudo_poster: string | null;
  usuario_nome: string | null;
  usuario_email: string | null;
  usuario_avatar: string | null;
  total_dispositivos_conta: number;
}

export async function buscarRadarOnline(): Promise<{
  totalOnline: number;
  totalDispositivos: number;
  sessoes: SessoesOnlineItem[];
}> {
  const limiteIso = new Date(Date.now() - 2 * 60 * 1000).toISOString();

  const { rows } = await pool.query<{
    nr_id_telegram: number;
    dispositivo: string;
    status: string;
    ultima_atividade: string;
    cd_conteudo: string | null;
    conteudo_titulo: string | null;
    conteudo_poster: string | null;
    usuario_nome: string | null;
    usuario_email: string | null;
    usuario_avatar: string | null;
  }>(
    `SELECT s.nr_id_telegram, s.dispositivo, s.status, s.ultima_atividade, s.cd_conteudo,
            c.nm_titulo AS "conteudo_titulo", c.ds_url_poster AS "conteudo_poster",
            u.nm_nome AS "usuario_nome", u.nm_email AS "usuario_email", u.ds_avatar AS "usuario_avatar"
     FROM "SESSOES" s
     LEFT JOIN "CONTEUDOS" c ON c.cd_conteudo = s.cd_conteudo
     LEFT JOIN "USUARIOS" u ON u.nr_id_telegram = s.nr_id_telegram OR u.nr_id_telegram_web = s.nr_id_telegram
     WHERE s.ultima_atividade > $1
     ORDER BY s.ultima_atividade DESC`,
    [limiteIso]
  );

  // Contagem de dispositivos/sessoes por conta
  const contagemMap = new Map<number, number>();
  for (const s of rows) {
    contagemMap.set(s.nr_id_telegram, (contagemMap.get(s.nr_id_telegram) ?? 0) + 1);
  }

  const sessoesFormatadas: SessoesOnlineItem[] = rows.map((s) => ({
    ...s,
    total_dispositivos_conta: contagemMap.get(s.nr_id_telegram) ?? 1,
  }));

  const usuariosUnicos = new Set(rows.map((r) => r.nr_id_telegram)).size;

  return {
    totalOnline: usuariosUnicos,
    totalDispositivos: rows.length,
    sessoes: sessoesFormatadas,
  };
}
