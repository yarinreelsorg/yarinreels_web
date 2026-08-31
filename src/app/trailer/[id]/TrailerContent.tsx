"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Conteudo } from "@/types/database";

const CHAVE_CURTIDO = (id: string) => `yarinreels:trailer-curtido:${id}`;

function seedCurtidas(nrViews: number) {
  // Contador de curtida é decorativo (não existe like real no banco) —
  // só uma estimativa plausível a partir das views reais do conteúdo,
  // pra não começar do zero numa página pensada pra converter tráfego pago.
  return Math.max(120, Math.round(nrViews * 0.18));
}

function formatarCompacto(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(".", ",")}K`;
  return String(n);
}

const ITENS_NAV = [
  { label: "Início", href: "/", icone: "🏠" },
  { label: "Explorar", href: "/catalogo", icone: "🔎" },
  { label: "Minha lista", href: "/minha-lista", icone: "📂" },
];

export default function TrailerContent({
  conteudo,
  src,
  limiteSegundos,
  tags,
  logado,
}: {
  conteudo: Conteudo;
  src: string;
  /** Corta a reprodução nesse segundo e mostra o CTA de assinar/comprar —
   * usado quando NÃO há clipe vertical manual (toca o vídeo real do filme
   * sem exigir login, então a prévia precisa ser limitada). null = sem
   * limite (clipe curado manualmente, já pensado pra tocar inteiro). */
  limiteSegundos: number | null;
  tags: string[];
  logado: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [tocando, setTocando] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [mudo, setMudo] = useState(true);
  const [curtido, setCurtido] = useState(false);
  const [curtidas, setCurtidas] = useState(() => seedCurtidas(conteudo.nr_views));
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [feedbackPulo, setFeedbackPulo] = useState<"tras" | "frente" | null>(null);
  const [previaEncerrada, setPreviaEncerrada] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: import("hls.js").default | null = null;
    let destruido = false;

    function aoPoderTocar() {
      setCarregando(false);
    }

    function aoAtualizarTempo() {
      if (video && limiteSegundos !== null && video.currentTime >= limiteSegundos) {
        video.pause();
        setTocando(false);
        setPreviaEncerrada(true);
      }
    }

    if (src.includes(".m3u8")) {
      import("hls.js").then(({ default: Hls }) => {
        if (destruido || !video) return;
        if (Hls.isSupported()) {
          hls = new Hls();
          hls.loadSource(src);
          hls.attachMedia(video);
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = src;
        }
      });
    } else {
      video.src = src;
    }

    video.addEventListener("canplay", aoPoderTocar);
    video.addEventListener("timeupdate", aoAtualizarTempo);
    video.play().catch(() => {});

    return () => {
      destruido = true;
      video.removeEventListener("canplay", aoPoderTocar);
      video.removeEventListener("timeupdate", aoAtualizarTempo);
      hls?.destroy();
    };
  }, [src, limiteSegundos]);

  useEffect(() => {
    Promise.resolve().then(() => {
      try {
        setCurtido(window.localStorage.getItem(CHAVE_CURTIDO(conteudo.cd_conteudo)) === "1");
      } catch {
        // localStorage indisponível — segue sem estado persistido
      }
    });
  }, [conteudo.cd_conteudo]);

  function alternarPlay() {
    if (previaEncerrada) return;
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setTocando(true);
    } else {
      video.pause();
      setTocando(false);
    }
  }

  function alternarMudo() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMudo(video.muted);
  }

  function pular(segundos: number) {
    if (previaEncerrada) return;
    const video = videoRef.current;
    if (!video || !isFinite(video.duration)) return;
    const teto = limiteSegundos !== null ? Math.min(video.duration, limiteSegundos) : video.duration;
    video.currentTime = Math.min(Math.max(video.currentTime + segundos, 0), teto);
    setFeedbackPulo(segundos < 0 ? "tras" : "frente");
    window.setTimeout(() => setFeedbackPulo(null), 400);
  }

  function alternarCurtida() {
    const novoValor = !curtido;
    setCurtido(novoValor);
    setCurtidas((atual) => atual + (novoValor ? 1 : -1));
    try {
      window.localStorage.setItem(CHAVE_CURTIDO(conteudo.cd_conteudo), novoValor ? "1" : "0");
    } catch {
      // localStorage indisponível — reação fica só na sessão atual
    }
  }

  async function compartilhar() {
    const url = `${window.location.origin}/trailer/${conteudo.cd_conteudo}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: conteudo.nm_titulo, url });
      } catch {
        // usuário cancelou o share nativo — não é erro
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopiado(true);
      window.setTimeout(() => setLinkCopiado(false), 2000);
    } catch {
      // clipboard indisponível — sem feedback, mas sem quebrar a página
    }
  }

  const perfilHref = logado ? "/conta" : "/login";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <div className="relative h-dvh w-full max-w-[480px] overflow-hidden bg-black">
        <video
          ref={videoRef}
          poster={conteudo.ds_url_poster ?? undefined}
          muted={mudo}
          loop
          playsInline
          disablePictureInPicture
          onClick={alternarPlay}
          onContextMenu={(e) => e.preventDefault()}
          className="absolute inset-0 h-full w-full object-cover"
        />

        {carregando && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          </div>
        )}

        {!tocando && !carregando && !previaEncerrada && (
          <button
            type="button"
            onClick={alternarPlay}
            aria-label="Reproduzir"
            className="absolute inset-0 flex items-center justify-center bg-black/20"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/50 text-3xl text-white">
              ▶
            </span>
          </button>
        )}

        {previaEncerrada && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 px-8 text-center">
            <span className="text-4xl">🔒</span>
            <p className="text-lg font-black text-white">Prévia encerrada</p>
            <p className="text-sm text-white/70">
              Continue assistindo {conteudo.nm_titulo} agora mesmo
            </p>
            <Link
              href={`/assistir/${conteudo.cd_conteudo}`}
              className="mt-2 rounded-full bg-primary px-8 py-3 text-sm font-bold text-white shadow-[0_4px_20px_rgba(194,24,91,0.6)] active:scale-95"
            >
              ▷ Assistir agora
            </Link>
          </div>
        )}

        {/* Controles de +15s/-15s: zonas transparentes no meio da tela */}
        {!previaEncerrada && (
          <>
            <div className="absolute inset-y-0 left-0 flex w-1/2 items-center justify-start pl-6">
              <button
                type="button"
                onClick={() => pular(-15)}
                aria-label="Voltar 15 segundos"
                className={`flex h-14 w-14 items-center justify-center rounded-full text-white transition-all ${
                  feedbackPulo === "tras" ? "scale-110 bg-white/20" : "bg-transparent"
                }`}
              >
                <IconePulo direcao="tras" />
              </button>
            </div>
            <div className="absolute inset-y-0 right-0 flex w-1/2 items-center justify-end pr-6">
              <button
                type="button"
                onClick={() => pular(15)}
                aria-label="Avançar 15 segundos"
                className={`flex h-14 w-14 items-center justify-center rounded-full text-white transition-all ${
                  feedbackPulo === "frente" ? "scale-110 bg-white/20" : "bg-transparent"
                }`}
              >
                <IconePulo direcao="frente" />
              </button>
            </div>
          </>
        )}

        {/* Som + voltar */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-black/60 to-transparent p-4">
          <Link
            href={`/filme/${conteudo.cd_conteudo}`}
            aria-label="Voltar"
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white"
          >
            <IconeVoltar />
          </Link>
          <button
            type="button"
            onClick={alternarMudo}
            aria-label={mudo ? "Ativar som" : "Mudo"}
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white"
          >
            {mudo ? "🔇" : "🔊"}
          </button>
        </div>

        {/* Interações sociais flutuantes — canto direito */}
        <div className="absolute bottom-40 right-3 flex flex-col items-center gap-5">
          <button
            type="button"
            onClick={alternarCurtida}
            aria-label={curtido ? "Descurtir" : "Curtir"}
            className="flex flex-col items-center gap-1"
          >
            <span
              className={`text-3xl transition-transform ${curtido ? "scale-110" : ""}`}
              style={{ color: curtido ? "#E50914" : "#fff" }}
            >
              {curtido ? "♥" : "♡"}
            </span>
            <span className="text-xs font-bold text-white drop-shadow">
              {formatarCompacto(curtidas)}
            </span>
          </button>
          <button
            type="button"
            onClick={compartilhar}
            aria-label="Compartilhar"
            className="flex flex-col items-center gap-1"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-xl text-white">
              ↗
            </span>
            <span className="text-[10px] font-bold text-white drop-shadow">
              {linkCopiado ? "Copiado!" : "Enviar"}
            </span>
          </button>
        </div>

        {/* Overlay inferior: título, episódio, tags + CTA */}
        <div className="absolute inset-x-0 bottom-[75px] bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 pb-5 pt-16">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-black text-white drop-shadow">
                {conteudo.nm_titulo}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="rounded bg-white/15 px-2 py-0.5 text-[11px] font-bold text-white">
                  EP 1
                </span>
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/90"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <Link
              href={`/assistir/${conteudo.cd_conteudo}`}
              className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_20px_rgba(194,24,91,0.6)] active:scale-95"
            >
              ▷ Assistir série
            </Link>
          </div>
        </div>

        {/* Menu de navegação fixo */}
        <nav className="absolute inset-x-0 bottom-0 flex h-[75px] items-center justify-around border-t border-white/10 bg-black/80 backdrop-blur-sm">
          {ITENS_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 text-[11px] font-bold text-white/70"
            >
              <span className="text-xl">{item.icone}</span>
              {item.label}
            </Link>
          ))}
          <Link href={perfilHref} className="flex flex-col items-center gap-1 text-[11px] font-bold text-white/70">
            <span className="text-xl">👤</span>
            Perfil
          </Link>
        </nav>
      </div>
    </div>
  );
}

function IconeVoltar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconePulo({ direcao }: { direcao: "tras" | "frente" }) {
  const espelhar = direcao === "tras";
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      style={espelhar ? { transform: "scaleX(-1)" } : undefined}
    >
      <path d="M20 12a8 8 0 1 0-2.6 5.9" strokeLinecap="round" />
      <path d="M20 6v5h-5" strokeLinecap="round" strokeLinejoin="round" />
      <text
        x="12"
        y="15.5"
        fontSize="7.5"
        fill="currentColor"
        stroke="none"
        textAnchor="middle"
        fontFamily="sans-serif"
        fontWeight="700"
        style={espelhar ? { transform: "scaleX(-1)", transformOrigin: "12px 12px" } : undefined}
      >
        15
      </text>
    </svg>
  );
}
