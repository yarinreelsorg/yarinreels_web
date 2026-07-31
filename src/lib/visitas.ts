"use server";

import { cookies, headers } from "next/headers";
import { pool } from "@/lib/db";
import { getSessaoUsuario } from "@/lib/user-auth";

const COOKIE_SESSAO = "visitor_session";
const JANELA_ONLINE_MINUTOS = 5;

function detectarDispositivo(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/smart-tv|smarttv|googletv|appletv|tizen|webos|hbbtv/.test(ua)) return "Smart TV";
  if (/android/.test(ua)) return "Android";
  if (/iphone|ipad|ipod/.test(ua)) return "iOS";
  if (/windows/.test(ua)) return "Windows";
  if (/macintosh|mac os/.test(ua)) return "Mac";
  if (/linux/.test(ua)) return "Linux";
  return "Outro";
}

async function obterOuCriarSessao(): Promise<string> {
  const cookieStore = await cookies();
  const existente = cookieStore.get(COOKIE_SESSAO)?.value;
  if (existente) return existente;

  const novo = crypto.randomUUID();
  try {
    cookieStore.set(COOKIE_SESSAO, novo, {
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
    });
  } catch {
    // Server Actions podem chamar isso fora de um contexto que aceita
    // set-cookie (ex: durante render) — nesse caso a sessão só não
    // persiste entre pageviews, sem quebrar o registro da visita atual.
  }
  return novo;
}

export async function registrarVisita(pagina: string) {
  try {
    const [headerStore, sessao, cdSessao] = await Promise.all([
      headers(),
      getSessaoUsuario(),
      obterOuCriarSessao(),
    ]);

    const userAgent = headerStore.get("user-agent") ?? "";
    const ip =
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headerStore.get("x-real-ip") ??
      null;

    await pool.query(
      `INSERT INTO "VISITAS" (cd_sessao, nr_id_telegram, ds_pagina, ds_ip, ds_dispositivo)
       VALUES ($1, $2, $3, $4, $5)`,
      [cdSessao, sessao?.nr_id_telegram ?? null, pagina, ip, detectarDispositivo(userAgent)]
    );
  } catch {
    // rastreamento é best-effort — nunca deve quebrar a navegação do usuário
  }
}

export interface MetricasOnline {
  onlineAgora: number;
  visitasHoje: number;
  dispositivosHoje: { dispositivo: string; total: number }[];
}

export async function obterMetricasOnline(): Promise<MetricasOnline> {
  const agora = new Date();
  const janelaOnline = new Date(agora.getTime() - JANELA_ONLINE_MINUTOS * 60_000).toISOString();
  const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).toISOString();

  const [onlineResult, visitasHojeResult, dispositivosResult] = await Promise.all([
    pool.query<{ total: string }>(
      'SELECT COUNT(DISTINCT cd_sessao) AS total FROM "VISITAS" WHERE ts_criacao >= $1',
      [janelaOnline]
    ),
    pool.query<{ total: string }>('SELECT COUNT(*) AS total FROM "VISITAS" WHERE ts_criacao >= $1', [
      inicioHoje,
    ]),
    pool.query<{ dispositivo: string; total: string }>(
      `SELECT COALESCE(ds_dispositivo, 'Outro') AS dispositivo, COUNT(*) AS total
       FROM "VISITAS" WHERE ts_criacao >= $1
       GROUP BY dispositivo ORDER BY total DESC`,
      [inicioHoje]
    ),
  ]);

  return {
    onlineAgora: Number(onlineResult.rows[0]?.total ?? 0),
    visitasHoje: Number(visitasHojeResult.rows[0]?.total ?? 0),
    dispositivosHoje: dispositivosResult.rows.map((r) => ({
      dispositivo: r.dispositivo,
      total: Number(r.total),
    })),
  };
}
