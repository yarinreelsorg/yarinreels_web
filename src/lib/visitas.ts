"use server";

import { cookies, headers } from "next/headers";
import { pool } from "@/lib/db";
import { getSessaoUsuario } from "@/lib/user-auth";

const COOKIE_SESSAO = "visitor_session";
const COOKIE_ORIGEM = "visitor_origem";
const JANELA_ONLINE_MINUTOS = 5;

export async function salvarOrigemVisitante(origem: string) {
  if (!origem) return;
  try {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_ORIGEM, origem.trim(), {
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
    });
  } catch {
    // ignore
  }
}

export async function obterOrigemVisitante(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const origem = cookieStore.get(COOKIE_ORIGEM)?.value;
    if (origem && origem.trim()) return origem.trim();
  } catch {
    // ignore
  }
  return "Direto / Telegram";
}

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

export interface AcessoDiario {
  data: string; // "YYYY-MM-DD"
  total: number;
}

export interface MetricasAcessoDiario {
  hoje: number;
  ontem: number;
  serie: AcessoDiario[]; // últimos DIAS_GRAFICO dias, do mais antigo pro mais recente
}

const DIAS_GRAFICO = 14;

/**
 * Visitantes únicos (por sessão) por dia dos últimos DIAS_GRAFICO dias, pra
 * medir o crescimento orgânico do site (o cliente não roda anúncios, então
 * esse é o único jeito de acompanhar se o fluxo tá subindo ou caindo).
 */
export async function obterMetricasAcessoDiario(): Promise<MetricasAcessoDiario> {
  const agora = new Date();
  const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const inicioJanela = new Date(inicioHoje);
  inicioJanela.setDate(inicioJanela.getDate() - (DIAS_GRAFICO - 1));

  const { rows } = await pool.query<{ dia: string; total: string }>(
    `SELECT to_char(date_trunc('day', ts_criacao), 'YYYY-MM-DD') AS dia,
            COUNT(DISTINCT cd_sessao) AS total
     FROM "VISITAS"
     WHERE ts_criacao >= $1
     GROUP BY dia
     ORDER BY dia`,
    [inicioJanela.toISOString()]
  );

  const porDia = new Map(rows.map((r) => [r.dia, Number(r.total)]));

  const serie: AcessoDiario[] = [];
  for (let i = 0; i < DIAS_GRAFICO; i++) {
    const dia = new Date(inicioJanela);
    dia.setDate(dia.getDate() + i);
    const chave = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, "0")}-${String(
      dia.getDate()
    ).padStart(2, "0")}`;
    serie.push({ data: chave, total: porDia.get(chave) ?? 0 });
  }

  return {
    hoje: serie[serie.length - 1]?.total ?? 0,
    ontem: serie[serie.length - 2]?.total ?? 0,
    serie,
  };
}
