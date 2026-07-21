"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { Conteudo, Episodio } from "@/types/database";
import VideoPlayer from "@/components/player/VideoPlayer";
import { formatarPreco, temVideoTocavel } from "@/lib/catalogo";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";

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
  expiraEm,
}: {
  conteudo: Conteudo;
  episodios: Episodio[];
  episodioAtual: Episodio | null;
  statusAcesso: StatusAcessoPagina;
  expiraEm: string | null;
}) {
  const urlVideo = episodioAtual ? episodioAtual.ds_url_bunny : conteudo.ds_url_bunny;
  const tocavel = temVideoTocavel(urlVideo);
  const idProgresso = episodioAtual ? episodioAtual.cd_episodio : conteudo.cd_conteudo;

  const dataExpiracao = expiraEm
    ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
        new Date(expiraEm)
      )
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-[#050208]">
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

      {/* Player / bloqueios de acesso */}
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
          <BloqueioAcesso icone="🛒" titulo="Você ainda não tem acesso a este conteúdo">
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
        ) : tocavel ? (
          <>
            <VideoPlayer
              key={idProgresso}
              src={urlVideo as string}
              poster={conteudo.ds_url_poster}
              idProgresso={idProgresso}
              autoPlay
            />
            {dataExpiracao && (
              <p className="mt-2 text-xs text-[#A78BFA]/60">
                Seu acesso vale até {dataExpiracao}.
              </p>
            )}
          </>
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

      {/* Descrição */}
      {conteudo.ds_descricao && (
        <div className="px-4 py-6 sm:px-8">
          <p className="max-w-2xl text-sm leading-relaxed text-[#A78BFA]">
            {conteudo.ds_descricao}
          </p>
        </div>
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
