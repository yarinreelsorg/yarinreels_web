import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSessaoUsuario } from "@/lib/user-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { cd_conteudo, dispositivo } = body;

    let idTelegramNum = body.nr_id_telegram
      ? typeof body.nr_id_telegram === "number"
        ? body.nr_id_telegram
        : parseInt(body.nr_id_telegram, 10)
      : null;

    if (!idTelegramNum || Number.isNaN(idTelegramNum)) {
      const sessao = await getSessaoUsuario();
      if (sessao) {
        idTelegramNum = sessao.nr_id_telegram || sessao.nr_id_telegram_web || null;
      }
    }

    if (!idTelegramNum || Number.isNaN(idTelegramNum)) {
      return NextResponse.json({ ok: false, error: "Sem ID Telegram" }, { status: 200 });
    }

    const validContentId =
      typeof cd_conteudo === "string" && cd_conteudo.length === 36 ? cd_conteudo : null;

    const disp = typeof dispositivo === "string" && dispositivo.trim() ? dispositivo.trim() : "Navegador Web";

    await pool.query(
      `INSERT INTO "SESSOES" (nr_id_telegram, cd_conteudo, status, dispositivo, ultima_atividade)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (nr_id_telegram) DO UPDATE SET
           cd_conteudo = EXCLUDED.cd_conteudo,
           status = EXCLUDED.status,
           dispositivo = EXCLUDED.dispositivo,
           ultima_atividade = EXCLUDED.ultima_atividade`,
      [idTelegramNum, validContentId, "ONLINE", disp, new Date().toISOString()]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro no heartbeat /api/heartbeat:", error);
    return NextResponse.json({ ok: true });
  }
}
