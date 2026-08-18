"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import type { Conteudo, Episodio } from "@/types/database";
import VideoPlayer from "@/components/player/VideoPlayer";
import {
  formatarPreco,
  otimizarUrlPoster,
  resolverUrlVideo,
  temTrilhaLegendada,
  type TrilhaAudio,
} from "@/lib/catalogo";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";
import { registrarProgressoAssistindo } from "@/lib/historico-actions";

const ROTULO_FORMATO: Record<string, string> = {
  FILME: "Filme",
  SERIE: "Série",
  DOCUMENTARIO: "Documentário",
  AULA: "Aula",
};

type StatusAcessoPagina = "sem_login" | "negado" | "liberado";

export default function AssistirClient({
  conteudo,
  episodios,
  episodioAtual,
  statusAcesso,
  emCarencia = false,
}: {
  conteudo: Conteudo;
  episodios: Episodio[];
  episodioAtual: Episodio | null;
  statusAcesso: StatusAcessoPagina;
  /** Lançamento recente ainda na janela de carência — assinatura não libera,
   * só compra avulsa (aluguel/vitalício). */
  emCarencia?: boolean;
}) {
  const [trilha, setTrilha] = useState<TrilhaAudio>("dublado");

  const itemFonte = episodioAtual
    ? {
        tp_fonte_prioritaria: conteudo.tp_fonte_prioritaria,
        ds_url_bunny: episodioAtual.ds_url_bunny,
        ds_file_id_telegram: episodioAtual.ds_file_id_telegram,
        ds_url_bunny_legendado: episodioAtual.ds_url_bunny_legendado,
        ds_file_id_telegram_legendado: episodioAtual.ds_file_id_telegram_legendado,
        nm_titulo: episodioAtual.nm_titulo,
      }
    : conteudo;

  const urlVideo = resolverUrlVideo(itemFonte, trilha);
  const temLegendado = temTrilhaLegendada(itemFonte);
  const tocavel = !!urlVideo;
  const idProgresso = episodioAtual ? episodioAtual.cd_episodio : conteudo.cd_conteudo;

  const subtitulo = episodioAtual
    ? `Ep. ${episodioAtual.nr_episodio} · ${episodioAtual.nm_titulo}`
    : (ROTULO_FORMATO[conteudo.tp_formato] ?? conteudo.tp_formato);

  // Heartbeat de reproducao (Radar SESSOES)
  useEffect(() => {
    if (statusAcesso !== "liberado") return;
    const cdConteudo = conteudo.cd_conteudo;
    fetch("/api/heartbeat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cd_conteudo: cdConteudo }),
    }).catch(() => {});
  }, [statusAcesso, conteudo.cd_conteudo]);

  return (
    <div className="flex min-h-screen flex-col bg-[#050208]">
      {tocavel && statusAcesso === "liberado" ? (
        <div className="relative h-[100dvh] w-full bg-black">
          {temLegendado && (
            <div className="absolute right-3 top-3 z-20 flex overflow-hidden rounded-full border border-white/20 bg-black/70 text-xs font-bold backdrop-blur-sm">
              {(["dublado", "legendado"] as const).map((opcao) => (
                <button
                  key={opcao}
                  type="button"
                  onClick={() => setTrilha(opcao)}
                  className={`px-3 py-1.5 capitalize transition-colors ${
                    trilha === opcao ? "bg-primary text-white" : "text-white/70 hover:text-white"
                  }`}
                >
                  {opcao}
                </button>
              ))}
            </div>
          )}
          <VideoPlayer
            key={`${idProgresso}-${trilha}`}
            src={urlVideo as string}
            poster={otimizarUrlPoster(conteudo.ds_url_poster, 1080)}
            idProgresso={idProgresso}
            autoPlay
            titulo={conteudo.nm_titulo}
            subtitulo={subtitulo}
            descricao={conteudo.ds_descricao}
            hrefVoltar={`/filme/${conteudo.cd_conteudo}`}
            aoProgredir={(segundoAtual, duracaoTotal) =>
              registrarProgressoAssistindo(conteudo.cd_conteudo, segundoAtual, duracaoTotal)
            }
          />
        </div>
      ) : (
        <>
          {/* Barra superior */}
          <div className="flex items-center gap-4 px-4 py-4 sm:px-8">
            <Link
              href={`/filme/${conteudo.cd_conteudo}`}
              aria-label="Voltar"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-white transition-colors hover:bg-white/10"
            >
              ←
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-white sm:text-lg">
                {conteudo.nm_titulo}
                {episodioAtual && (
                  <span className="text-[#A78BFA]"> — Ep. {episodioAtual.nr_episodio}</span>
                )}
              </h1>
              <p className="text-xs text-[#A78BFA]/70">
                {ROTULO_FORMATO[conteudo.tp_formato] ?? conteudo.tp_formato}
              </p>
            </div>
          </div>

          {/* Bloqueios de acesso / conteúdo não disponível na web */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="px-4 sm:px-8"
          >
            {statusAcesso === "sem_login" ? (
              <BloqueioAcesso icone="🔒" titulo="Entre na sua conta para assistir">
                <Link
                  href={`/login?redirect_to=/assistir/${conteudo.cd_conteudo}`}
                  className="rounded-md bg-primary px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
                >
                  Entrar
                </Link>
              </BloqueioAcesso>
            ) : statusAcesso === "negado" ? (
              <BloqueioAcesso
                icone={emCarencia ? "⏳" : "🛒"}
                titulo={
                  emCarencia
                    ? "Lançamento recente — disponível só por compra avulsa"
                    : "Você ainda não tem acesso a este conteúdo"
                }
              >
                {emCarencia && (
                  <p className="max-w-sm text-xs text-[#A78BFA]/70">
                    A assinatura libera esse título em breve. Por enquanto, só quem compra
                    aluguel ou vitalício assiste.
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {conteudo.vl_aluguel && (
                    <span className="rounded-md border border-[rgba(139,92,246,0.3)] px-4 py-2 text-xs font-semibold text-[#A78BFA]">
                      Aluguel: {formatarPreco(conteudo.vl_aluguel)}
                    </span>
                  )}
                  {conteudo.vl_vitalicio && (
                    <span className="rounded-md border border-[rgba(139,92,246,0.3)] px-4 py-2 text-xs font-semibold text-[#A78BFA]">
                      Vitalício: {formatarPreco(conteudo.vl_vitalicio)}
                    </span>
                  )}
                </div>
                <Link
                  href={`/filme/${conteudo.cd_conteudo}`}
                  className="rounded-md bg-primary px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
                >
                  Ver opções de compra
                </Link>
                <p className="text-xs text-[#A78BFA]/60">
                  Já comprou pelo nosso bot no Telegram?{" "}
                  <Link href="/conta" className="font-semibold text-[#A78BFA] hover:underline">
                    Vincule sua conta
                  </Link>{" "}
                  pra sincronizar.
                </p>
              </BloqueioAcesso>
            ) : (
              <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-lg border border-[rgba(139,92,246,0.2)] bg-[#0D0A1A] px-6 text-center">
                <span className="text-4xl">📵</span>
                <p className="text-sm font-semibold text-white">
                  Este conteúdo ainda não está disponível pelo site.
                </p>
                <p className="max-w-sm text-xs text-[#A78BFA]/70">
                  Disponível apenas pelo nosso bot do Telegram por enquanto.
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* Episódios (séries) */}
      {episodios.length > 0 && (
        <div className="px-4 pb-16 sm:px-8">
          <h2 className="mb-4 text-lg font-bold text-white">Episódios</h2>
          <StaggerGroup className="flex flex-col divide-y divide-[rgba(139,92,246,0.1)] overflow-hidden rounded-md border border-[rgba(139,92,246,0.15)]">
            {episodios.map((episodio) => {
              const ativo = episodioAtual?.cd_episodio === episodio.cd_episodio;
              return (
                <StaggerItem key={episodio.cd_episodio}>
                  <Link
                    href={`/assistir/${conteudo.cd_conteudo}?ep=${episodio.nr_episodio}`}
                    className={`flex items-center gap-4 px-4 py-3 transition-colors hover:bg-white/5 ${
                      ativo ? "bg-[rgba(139,92,246,0.1)]" : ""
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        ativo ? "bg-[#7B2FBE] text-white" : "bg-[#0D0A1A] text-white"
                      }`}
                    >
                      {episodio.nr_episodio}
                    </span>
                    <span className="line-clamp-1 text-sm font-semibold text-white">
                      {episodio.nm_titulo}
                    </span>
                    {ativo && (
                      <span className="ml-auto text-xs font-semibold text-[#9D4EDD]">
                        Assistindo
                      </span>
                    )}
                  </Link>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </div>
      )}
    </div>
  );
}

function BloqueioAcesso({
  icone,
  titulo,
  children,
}: {
  icone: string;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 rounded-lg border border-[rgba(139,92,246,0.2)] bg-[#0D0A1A] px-6 text-center">
      <span className="text-4xl">{icone}</span>
      <p className="max-w-sm text-sm font-semibold text-white">{titulo}</p>
      {children}
    </div>
  );
}
