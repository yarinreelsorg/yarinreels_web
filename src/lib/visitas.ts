"use server";

import { cookies, headers } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
    const [headerStore, supabase] = await Promise.all([headers(), createSupabaseServerClient()]);
    const cdSessao = await obterOuCriarSessao();

    const userAgent = headerStore.get("user-agent") ?? "";
    const ip =
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headerStore.get("x-real-ip") ??
      null;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const nrIdTelegram =
      typeof user?.user_metadata?.nr_id_telegram === "number"
        ? user.user_metadata.nr_id_telegram
        : null;

    const admin = createSupabaseAdminClient();
    await admin.from("VISITAS").insert({
      cd_sessao: cdSessao,
      nr_id_telegram: nrIdTelegram,
      ds_pagina: pagina,
      ds_ip: ip,
      ds_dispositivo: detectarDispositivo(userAgent),
    });
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
  const supabase = createSupabaseAdminClient();

  const agora = new Date();
  const janelaOnline = new Date(agora.getTime() - JANELA_ONLINE_MINUTOS * 60_000).toISOString();
  const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).toISOString();

  const [{ data: sessoesOnline }, { count: visitasHoje }, { data: visitasDispositivo }] =
    await Promise.all([
      supabase.from("VISITAS").select("cd_sessao").gte("ts_criacao", janelaOnline),
      supabase
        .from("VISITAS")
        .select("*", { count: "exact", head: true })
        .gte("ts_criacao", inicioHoje),
      supabase.from("VISITAS").select("ds_dispositivo").gte("ts_criacao", inicioHoje),
    ]);

  const onlineAgora = new Set((sessoesOnline ?? []).map((v) => v.cd_sessao)).size;

  const contagemDispositivos = new Map<string, number>();
  for (const v of visitasDispositivo ?? []) {
    const chave = v.ds_dispositivo ?? "Outro";
    contagemDispositivos.set(chave, (contagemDispositivos.get(chave) ?? 0) + 1);
  }
  const dispositivosHoje = Array.from(contagemDispositivos.entries())
    .map(([dispositivo, total]) => ({ dispositivo, total }))
    .sort((a, b) => b.total - a.total);

  return { onlineAgora, visitasHoje: visitasHoje ?? 0, dispositivosHoje };
}
