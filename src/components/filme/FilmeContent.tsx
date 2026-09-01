"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Conteudo, Episodio } from "@/types/database";
import Navbar from "@/components/layout/Navbar";
import Carrossel from "@/components/catalog/Carrossel";
import Estrelas from "@/components/catalog/Estrelas";
import { formatarPreco, formatarViews, calcularRating } from "@/lib/catalogo";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";
import { buttonTap } from "@/lib/motion";
import BotaoMinhaLista from "@/components/catalog/BotaoMinhaLista";
import PosterImg from "@/components/catalog/PosterImg";

const ROTULO_FORMATO: Record<string, string> = {
  FILME: "Filme",
  SERIE: "Série",
  DOCUMENTARIO: "Documentário",
  AULA: "Aula",
};

function extrairIdYoutube(url: string | null) {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/
  );
  return match ? match[1] : null;
}

export default function FilmeContent({
  conteudo,
  episodios,
  similares,
  categorias,
  favoritado,
  logado,
  incluidoNaAssinatura = false,
}: {
  conteudo: Conteudo;
  episodios: Episodio[];
  similares: Conteudo[];
  categorias: string[];
  favoritado: boolean;
  logado: boolean;
  /** Usuário já tem acesso via assinatura ativa — some com os preços
   * avulsos, que ficam redundantes/confusos nesse caso. */
  incluidoNaAssinatura?: boolean;
}) {
  const [trailerAberto, setTrailerAberto] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);

  async function aoCompartilhar() {
    const url = `${window.location.origin}/filme/${conteudo.cd_conteudo}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: conteudo.nm_titulo, url });
      } catch {
        // usuário cancelou o share nativo — não é erro, ignora
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 2000);
    } catch {
      // clipboard indisponível (http local, permissão negada) — sem fallback melhor aqui
    }
  }

  const generos = conteudo.ds_generos
    ?.split(",")
    .map((g) => g.trim())
    .filter(Boolean);
  const precoAluguel = formatarPreco(conteudo.vl_aluguel);
  const precoVitalicio = formatarPreco(conteudo.vl_vitalicio);
  const rating = calcularRating(conteudo.nr_views);
  const ano = conteudo.dt_lancamento
    ? new Date(conteudo.dt_lancamento).getFullYear()
    : null;
  const duracao = conteudo.nr_duracao_minutos
    ? `${Math.floor(conteudo.nr_duracao_minutos / 60)}h${String(
        conteudo.nr_duracao_minutos % 60
      ).padStart(2, "0")}`
    : null;
  const trailerId = extrairIdYoutube(conteudo.ds_url_trailer_youtube);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar categorias={categorias} />

      <section className="relative flex min-h-[46vh] w-full items-end sm:min-h-[56vh] lg:min-h-[64vh]">
        <div className="absolute inset-0">
          {conteudo.ds_url_poster ? (
            <PosterImg
              src={conteudo.ds_url_poster}
              largura={100}
              alt=""
              loading="eager"
              className="h-full w-full scale-110 object-cover object-top blur-md"
            />
          ) : (
            <div className="h-full w-full bg-surface" />
          )}
          <div className="absolute inset-0 bg-background/50" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/75 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 flex w-full flex-col gap-6 px-4 pb-14 sm:px-8 lg:flex-row lg:items-end lg:gap-10"
        >
          <div className="relative hidden h-[390px] w-[260px] shrink-0 overflow-hidden rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] lg:block">
            {conteudo.ds_url_poster ? (
              <PosterImg
                src={conteudo.ds_url_poster}
                largura={520}
                alt={conteudo.nm_titulo}
                loading="eager"
                className="object-cover"
              />
            ) : (
              <div className="flex h-[390px] w-[260px] items-center justify-center bg-surface px-3 text-center text-sm text-secondary">
                {conteudo.nm_titulo}
              </div>
            )}
          </div>

          <div className="max-w-2xl">
            <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.08em] text-secondary">
              {conteudo.nm_categoria}
            </span>

            <h1 className="text-[34px] font-bold leading-[1.1] tracking-tight text-foreground sm:text-[46px]">
              {conteudo.nm_titulo}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-secondary">
              <Estrelas rating={rating} />
              <span>{rating.toFixed(1)}</span>
              {ano && (
                <>
                  <span>·</span>
                  <span>{ano}</span>
                </>
              )}
              {duracao && (
                <>
                  <span>·</span>
                  <span>{duracao}</span>
                </>
              )}
              <span>·</span>
              <span>{ROTULO_FORMATO[conteudo.tp_formato] ?? conteudo.tp_formato}</span>
              {conteudo.nm_idioma && (
                <>
                  <span>·</span>
                  <span>{conteudo.nm_idioma}</span>
                </>
              )}
              {typeof conteudo.nr_views === "number" && conteudo.nr_views > 0 && (
                <>
                  <span>·</span>
                  <span className="font-semibold text-emerald-400">
                    👁️ {formatarViews(conteudo.nr_views)}
                  </span>
                </>
              )}
            </div>

            {generos && generos.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {generos.map((genero) => (
                  <span
                    key={genero}
                    className="rounded-full border border-secondary/30 px-3 py-1 text-xs text-secondary"
                  >
                    {genero}
                  </span>
                ))}
              </div>
            )}

            {conteudo.ds_descricao && (
              <p className="mt-4 text-sm leading-relaxed text-secondary sm:text-base">
                {conteudo.ds_descricao}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <motion.div {...buttonTap}>
                <Link
                  href={`/assistir/${conteudo.cd_conteudo}`}
                  className="rounded-md bg-primary px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-primary-dark sm:text-sm"
                >
                  ▶ Assistir
                </Link>
              </motion.div>
              <BotaoMinhaLista
                cdConteudo={conteudo.cd_conteudo}
                favoritadoInicial={favoritado}
                logado={logado}
                className="rounded-md border border-secondary/40 px-5 py-2 text-xs font-bold text-foreground transition-colors hover:border-foreground sm:text-sm"
              />
              {trailerId && (
                <motion.button
                  type="button"
                  onClick={() => setTrailerAberto(true)}
                  {...buttonTap}
                  className="rounded-md border border-secondary/40 px-5 py-2 text-xs font-bold text-foreground transition-colors hover:border-foreground sm:text-sm"
                >
                  🎬 Trailer
                </motion.button>
              )}
              <motion.button
                type="button"
                onClick={aoCompartilhar}
                {...buttonTap}
                className="rounded-md border border-secondary/40 px-5 py-2 text-xs font-bold text-foreground transition-colors hover:border-foreground sm:text-sm"
              >
                {linkCopiado ? "✓ Link copiado!" : "🔗 Compartilhar"}
              </motion.button>
            </div>

            {incluidoNaAssinatura ? (
              <div className="mt-6 flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-400 w-fit">
                ✓ Incluído na sua assinatura
              </div>
            ) : (precoAluguel || precoVitalicio) && (
              <div className="mt-6 flex flex-wrap gap-4">
                {precoAluguel && (
                  <Link
                    href={`/checkout/conteudo/${conteudo.cd_conteudo}?tipo=ALUGUEL`}
                    className="rounded-md border border-border bg-surface px-5 py-3 transition-colors hover:border-primary/60"
                  >
                    <p className="text-xs uppercase tracking-wide text-secondary">
                      Aluguel · 7 dias
                    </p>
                    <p className="text-lg font-bold text-primary">{precoAluguel}</p>
                  </Link>
                )}
                {precoVitalicio && (
                  <Link
                    href={`/checkout/conteudo/${conteudo.cd_conteudo}?tipo=VITALICIO`}
                    className="rounded-md border border-border bg-surface px-5 py-3 transition-colors hover:border-primary/60"
                  >
                    <p className="text-xs uppercase tracking-wide text-secondary">
                      Vitalício
                    </p>
                    <p className="text-lg font-bold text-primary">
                      {precoVitalicio}
                    </p>
                  </Link>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {episodios.length > 0 && (
        <section className="px-4 py-8 sm:px-8">
          <h2 className="mb-4 text-[20px] font-bold text-foreground">
            Episódios
          </h2>
          <StaggerGroup className="flex flex-col divide-y divide-border overflow-hidden rounded-md border border-border">
            {episodios.map((episodio) => (
              <StaggerItem key={episodio.cd_episodio}>
                <Link
                  href={`/assistir/${conteudo.cd_conteudo}?ep=${episodio.nr_episodio}`}
                  className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-white/5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-sm font-bold text-foreground">
                    {episodio.nr_episodio}
                  </span>
                  <span className="line-clamp-1 text-sm font-semibold text-foreground">
                    {episodio.nm_titulo}
                  </span>
                  <span className="ml-auto text-lg text-secondary">▶</span>
                </Link>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>
      )}

      {similares.length > 0 && (
        <Carrossel
          titulo="Mais como este"
          itens={similares}
          verTudoHref={`/catalogo?categoria=${encodeURIComponent(conteudo.nm_categoria)}`}
          discreto
        />
      )}

      <AnimatePresence>
        {trailerId && trailerAberto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 p-4"
            onClick={() => setTrailerAberto(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="aspect-video w-full max-w-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                src={`https://www.youtube.com/embed/${trailerId}?autoplay=1`}
                title="Trailer"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="h-full w-full rounded-lg"
              />
            </motion.div>
            <button
              type="button"
              onClick={() => setTrailerAberto(false)}
              aria-label="Fechar trailer"
              className="absolute right-6 top-6 text-3xl text-white"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
