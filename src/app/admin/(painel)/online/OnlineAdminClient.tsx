"use client";

import { useEffect, useState, useTransition } from "react";
import { formatarDataHora } from "@/lib/data";
import Avatar from "@/components/ui/Avatar";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";
import Reveal from "@/components/motion/Reveal";
import { buscarRadarOnline, type SessoesOnlineItem } from "./actions";

export default function OnlineAdminClient({
  dadosIniciais,
}: {
  dadosIniciais: {
    totalOnline: number;
    totalDispositivos: number;
    sessoes: SessoesOnlineItem[];
  };
}) {
  const [isPending, startTransition] = useTransition();
  const [dados, setDados] = useState(dadosIniciais);
  const [autoAtualizar, setAutoAtualizar] = useState(true);
  const [busca, setBusca] = useState("");

  const carregarDados = () => {
    startTransition(async () => {
      try {
        const res = await buscarRadarOnline();
        setDados(res);
      } catch (err) {
        console.error("Erro ao atualizar radar online:", err);
      }
    });
  };

  useEffect(() => {
    if (!autoAtualizar) return;
    const interval = setInterval(carregarDados, 10_000);
    return () => clearInterval(interval);
  }, [autoAtualizar]);

  const sessoesFiltradas = dados.sessoes.filter((s) => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      String(s.nr_id_telegram).includes(termo) ||
      (s.usuario_nome && s.usuario_nome.toLowerCase().includes(termo)) ||
      (s.usuario_email && s.usuario_email.toLowerCase().includes(termo)) ||
      (s.conteudo_titulo && s.conteudo_titulo.toLowerCase().includes(termo)) ||
      (s.dispositivo && s.dispositivo.toLowerCase().includes(termo))
    );
  });

  const totalAssistindo = dados.sessoes.filter((s) => !!s.cd_conteudo).length;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            Radar Online em Tempo Real
          </h1>
          <p className="text-sm text-[#A78BFA] mt-1">
            Monitoramento ao vivo de presença, conteúdo assistido e dispositivos conectados por conta.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setAutoAtualizar(!autoAtualizar)}
            className={`rounded-md px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer border ${
              autoAtualizar
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-secondary/30 bg-surface text-secondary"
            }`}
          >
            {autoAtualizar ? "🟢 Auto-refresh (10s)" : "⏸️ Auto-refresh Pausado"}
          </button>

          <button
            type="button"
            onClick={carregarDados}
            disabled={isPending}
            className="rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            {isPending ? "Atualizando..." : "🔄 Atualizar Agora"}
          </button>
        </div>
      </div>

      {/* Cards de Métricas do Radar */}
      <StaggerGroup className="grid gap-6 sm:grid-cols-3" staggerChildren={0.06}>
        <StaggerItem className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg">
          <span className="text-sm font-medium text-[#A78BFA]">Usuários Online Agora</span>
          <h3 className="mt-3 text-4xl font-black text-emerald-400 flex items-center gap-2">
            👥 {dados.totalOnline}
          </h3>
          <p className="mt-1 text-xs text-[#A78BFA]/70">últimos 2 minutos</p>
        </StaggerItem>

        <StaggerItem className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg">
          <span className="text-sm font-medium text-[#A78BFA]">Assistindo Vídeo / Filme</span>
          <h3 className="mt-3 text-4xl font-black text-[#9D4EDD] flex items-center gap-2">
            🎬 {totalAssistindo}
          </h3>
          <p className="mt-1 text-xs text-[#A78BFA]/70">reprodução em andamento</p>
        </StaggerItem>

        <StaggerItem className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg">
          <span className="text-sm font-medium text-[#A78BFA]">Conexões / Aparelhos Ativos</span>
          <h3 className="mt-3 text-4xl font-black text-white flex items-center gap-2">
            📱 {dados.totalDispositivos}
          </h3>
          <p className="mt-1 text-xs text-[#A78BFA]/70">sessões ativas no banco</p>
        </StaggerItem>
      </StaggerGroup>

      {/* Barra de Busca e Filtro */}
      <div className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-4 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-lg font-bold text-white">Sessões Ativas ({sessoesFiltradas.length})</h2>
        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="Buscar por ID Telegram, usuário, título ou aparelho..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] py-2 px-3 text-white text-xs"
          />
        </div>
      </div>

      {/* Lista de Sessões Online em Tempo Real */}
      <Reveal>
        {sessoesFiltradas.length === 0 ? (
          <div className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-12 text-center">
            <span className="text-4xl">💤</span>
            <h3 className="mt-3 text-lg font-bold text-white">Nenhum usuário ativo no momento</h3>
            <p className="mt-1 text-xs text-[#A78BFA]">
              Os usuários que acessarem o site ou assistirem vídeos nos últimos 2 minutos aparecerão aqui automaticamente.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sessoesFiltradas.map((s) => (
              <div
                key={`${s.nr_id_telegram}_${s.ultima_atividade}`}
                className="flex flex-col justify-between rounded-lg border border-[rgba(139,92,246,0.2)] bg-[#0D0A1A] p-5 shadow-lg space-y-4 hover:border-[#9D4EDD] transition-colors"
              >
                {/* Header Cliente */}
                <div className="flex items-center gap-3 border-b border-[rgba(139,92,246,0.15)] pb-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#050208] border border-[rgba(139,92,246,0.3)]">
                    <Avatar valor={s.usuario_avatar} className="h-full w-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-white truncate text-sm">
                      {s.usuario_nome || s.usuario_email || `Cliente #${s.nr_id_telegram}`}
                    </p>
                    <a
                      href={`https://t.me/${s.nr_id_telegram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-[#A78BFA] hover:underline"
                    >
                      ID Telegram: {s.nr_id_telegram}
                    </a>
                  </div>
                </div>

                {/* Conteúdo Assistido */}
                <div className="rounded-md border border-[rgba(139,92,246,0.1)] bg-[#050208]/80 p-3 flex items-center gap-3">
                  {s.conteudo_poster ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.conteudo_poster}
                      alt=""
                      className="h-12 w-9 rounded object-cover shrink-0"
                    />
                  ) : (
                    <div className="flex h-12 w-9 items-center justify-center rounded bg-[#7B2FBE]/20 text-sm">
                      🎬
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#A78BFA]">
                      O que está fazendo:
                    </p>
                    <p className="font-bold text-white text-xs truncate mt-0.5">
                      {s.conteudo_titulo ? s.conteudo_titulo : "Navegando no Catálogo"}
                    </p>
                  </div>
                </div>

                {/* Info Aparelho & Conexões */}
                <div className="grid grid-cols-2 gap-2 text-xs border-t border-[rgba(139,92,246,0.15)] pt-3">
                  <div>
                    <span className="text-[#A78BFA] block text-[10px] uppercase">Aparelho</span>
                    <span className="font-bold text-white">{s.dispositivo}</span>
                  </div>

                  <div>
                    <span className="text-[#A78BFA] block text-[10px] uppercase">Aparelhos na Conta</span>
                    <span className="font-bold text-purple-300">
                      📱 {s.total_dispositivos_conta} {s.total_dispositivos_conta === 1 ? "dispositivo" : "dispositivos"}
                    </span>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="flex items-center justify-between text-[11px] text-[#A78BFA]/70 pt-1">
                  <span>Sinal em tempo real</span>
                  <span className="font-mono">
                    {formatarDataHora(s.ultima_atividade, {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Reveal>
    </div>
  );
}
