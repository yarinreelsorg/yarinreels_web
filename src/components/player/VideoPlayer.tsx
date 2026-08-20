"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const RETOMAR_ATE_PORCENTAGEM = 0.95;
const SALVAR_PROGRESSO_INTERVALO_MS = 5000;
const OCULTAR_CONTROLES_MS = 3000;

function chaveProgresso(idProgresso: string) {
  return `yarinreels:progresso:${idProgresso}`;
}

function lerProgressoSalvo(idProgresso: string) {
  if (typeof window === "undefined") return 0;
  const valor = window.localStorage.getItem(chaveProgresso(idProgresso));
  return valor ? Number(valor) || 0 : 0;
}

function salvarProgresso(idProgresso: string, segundos: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(chaveProgresso(idProgresso), String(Math.floor(segundos)));
}

function formatarTempo(segundos: number) {
  if (!isFinite(segundos) || segundos < 0) segundos = 0;
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = Math.floor(segundos % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function VideoPlayer({
  src,
  poster,
  idProgresso,
  autoPlay = false,
  titulo,
  subtitulo,
  descricao,
  hrefVoltar,
  aoProgredir,
}: {
  src: string;
  poster?: string | null;
  /** Chave única (ex: cd_conteudo ou cd_episodio) usada pra guardar "continuar assistindo". */
  idProgresso: string;
  autoPlay?: boolean;
  titulo?: string;
  subtitulo?: string;
  descricao?: string | null;
  hrefVoltar?: string;
  /** Chamado periodicamente durante a reprodução, pra sincronizar o progresso no servidor. */
  aoProgredir?: (segundoAtual: number, duracaoTotal: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const esconderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aoProgredirRef = useRef(aoProgredir);
  useEffect(() => {
    aoProgredirRef.current = aoProgredir;
  }, [aoProgredir]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [tocando, setTocando] = useState(false);
  const [tempoAtual, setTempoAtual] = useState(0);
  const [duracao, setDuracao] = useState(0);
  const [volume, setVolume] = useState(1);
  const [mudo, setMudo] = useState(false);
  const [telaCheia, setTelaCheia] = useState(false);
  const [controlesVisiveis, setControlesVisiveis] = useState(true);
  const [arrastando, setArrastando] = useState(false);

  function agendarOcultarControles() {
    if (esconderTimeoutRef.current) clearTimeout(esconderTimeoutRef.current);
    esconderTimeoutRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setControlesVisiveis(false);
    }, OCULTAR_CONTROLES_MS);
  }

  function mostrarControles() {
    setControlesVisiveis(true);
    agendarOcultarControles();
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setCarregando(true);
    setErro(null);

    let hls: import("hls.js").default | null = null;
    let destruido = false;

    function aoCarregarMetadados() {
      if (!video) return;
      const progressoSalvo = lerProgressoSalvo(idProgresso);
      if (progressoSalvo > 5 && progressoSalvo < video.duration * RETOMAR_ATE_PORCENTAGEM) {
        video.currentTime = progressoSalvo;
      }
      setDuracao(video.duration || 0);
      setCarregando(false);
    }

    function aoDarErro() {
      setErro("Não foi possível carregar o vídeo. Tente novamente em instantes.");
      setCarregando(false);
    }

    function aoAtualizarTempo() {
      if (video) setTempoAtual(video.currentTime);
    }

    function aoTocar() {
      setTocando(true);
      agendarOcultarControles();
    }

    function aoPausarEvento() {
      setTocando(false);
      if (esconderTimeoutRef.current) clearTimeout(esconderTimeoutRef.current);
      setControlesVisiveis(true);
    }

    video.addEventListener("loadedmetadata", aoCarregarMetadados);
    video.addEventListener("error", aoDarErro);
    video.addEventListener("timeupdate", aoAtualizarTempo);
    video.addEventListener("play", aoTocar);
    video.addEventListener("pause", aoPausarEvento);

    if (src.includes(".m3u8")) {
      import("hls.js").then(({ default: Hls }) => {
        if (destruido) return;

        if (Hls.isSupported()) {
          hls = new Hls({ maxBufferLength: 30 });
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(Hls.Events.ERROR, (_evento, data) => {
            if (data.fatal) aoDarErro();
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          // Safari toca HLS nativamente
          video.src = src;
        } else {
          aoDarErro();
        }
      });
    } else {
      video.src = src;
    }

    const intervalo = window.setInterval(() => {
      if (!video.paused && !video.ended) {
        salvarProgresso(idProgresso, video.currentTime);
        aoProgredirRef.current?.(video.currentTime, video.duration || 0);
      }
    }, SALVAR_PROGRESSO_INTERVALO_MS);

    function aoTerminar() {
      salvarProgresso(idProgresso, 0);
      const duracaoFinal = video?.duration || 0;
      aoProgredirRef.current?.(duracaoFinal, duracaoFinal);
    }

    video.addEventListener("ended", aoTerminar);

    return () => {
      destruido = true;
      window.clearInterval(intervalo);
      video.removeEventListener("loadedmetadata", aoCarregarMetadados);
      video.removeEventListener("error", aoDarErro);
      video.removeEventListener("timeupdate", aoAtualizarTempo);
      video.removeEventListener("play", aoTocar);
      video.removeEventListener("pause", aoPausarEvento);
      video.removeEventListener("ended", aoTerminar);
      if (video.currentTime > 0) {
        salvarProgresso(idProgresso, video.currentTime);
        aoProgredirRef.current?.(video.currentTime, video.duration || 0);
      }
      hls?.destroy();
    };
  }, [src, idProgresso]);

  useEffect(() => {
    function aoMudarTelaCheia() {
      setTelaCheia(document.fullscreenElement === containerRef.current);
    }
    document.addEventListener("fullscreenchange", aoMudarTelaCheia);
    return () => document.removeEventListener("fullscreenchange", aoMudarTelaCheia);
  }, []);

  function alternarPlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  }

  function pular(segundos: number) {
    const video = videoRef.current;
    if (!video || !isFinite(video.duration)) return;
    video.currentTime = Math.min(Math.max(video.currentTime + segundos, 0), video.duration);
  }

  function buscarPorPosicao(clientX: number) {
    const track = trackRef.current;
    const video = videoRef.current;
    if (!track || !video || !duracao) return;
    const rect = track.getBoundingClientRect();
    const fracao = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    video.currentTime = fracao * duracao;
    setTempoAtual(fracao * duracao);
  }

  function aoIniciarArraste(e: React.PointerEvent<HTMLDivElement>) {
    setArrastando(true);
    buscarPorPosicao(e.clientX);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function aoArrastar(e: React.PointerEvent<HTMLDivElement>) {
    if (!arrastando) return;
    buscarPorPosicao(e.clientX);
  }

  function aoSoltarArraste() {
    setArrastando(false);
  }

  function alternarMudo() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMudo(video.muted);
  }

  function aoMudarVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    const video = videoRef.current;
    if (!video) return;
    video.volume = v;
    video.muted = v === 0;
    setVolume(v);
    setMudo(v === 0);
  }

  async function alternarTelaCheia() {
    const container = containerRef.current;
    if (!container) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await container.requestFullscreen();
    } catch {
      // navegador recusou (ex: fora de gesto do usuário) — sem tratamento especial
    }
  }

  function aoTecla(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === " " || e.key === "k") {
      e.preventDefault();
      alternarPlay();
    } else if (e.key === "ArrowRight") {
      pular(10);
    } else if (e.key === "ArrowLeft") {
      pular(-10);
    } else if (e.key === "f") {
      alternarTelaCheia();
    } else if (e.key === "m") {
      alternarMudo();
    }
  }

  const progresso = duracao > 0 ? (tempoAtual / duracao) * 100 : 0;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={aoTecla}
      onMouseMove={mostrarControles}
      onClick={() => !arrastando && alternarPlay()}
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-black outline-none select-none"
    >
      <video
        ref={videoRef}
        poster={poster ?? undefined}
        autoPlay={autoPlay}
        playsInline
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        className="relative h-full w-full object-cover"
      />

      {carregando && !erro && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        </div>
      )}

      {erro && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black px-4 text-center">
          <span className="text-3xl">⚠️</span>
          <p className="text-sm text-white/80">{erro}</p>
        </div>
      )}

      {!carregando && !erro && (
        <>
          {/* Topo: voltar — sempre visível, não some com o resto dos
              controles, pra nunca dar a sensação de "preso" no player. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start bg-gradient-to-b from-black/70 to-transparent p-3 sm:p-6">
            {hrefVoltar && (
              <Link
                href={hrefVoltar}
                aria-label="Voltar"
                onClick={(e) => e.stopPropagation()}
                className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-white/20"
              >
                <IconeVoltar />
              </Link>
            )}
          </div>

          {/* Painel "Você está assistindo" — só quando pausado */}
          {!tocando && (titulo || descricao) && (
            <div className="pointer-events-none absolute inset-x-0 bottom-24 px-4 sm:bottom-28 sm:px-10">
              <p className="text-xs font-medium text-white/60">Você está assistindo</p>
              {titulo && (
                <h2 className="mt-1 flex items-center gap-2 text-xl font-black text-white sm:text-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icon.png" alt="Logo" className="h-7 w-7 rounded-md object-cover shrink-0" />
                  {titulo}
                </h2>
              )}
              {subtitulo && (
                <p className="mt-0.5 text-sm font-semibold text-white/80">{subtitulo}</p>
              )}
              {descricao && (
                <p className="mt-2 line-clamp-2 max-w-md text-xs text-white/50 sm:text-sm">
                  {descricao}
                </p>
              )}
            </div>
          )}

          {/* Controles inferiores */}
          <div
            onClick={(e) => e.stopPropagation()}
            className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-3 pb-3 pt-10 transition-opacity duration-300 sm:px-6 ${
              controlesVisiveis ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                ref={trackRef}
                onPointerDown={aoIniciarArraste}
                onPointerMove={aoArrastar}
                onPointerUp={aoSoltarArraste}
                className="group/bar relative h-1.5 flex-1 cursor-pointer rounded-full bg-white/25"
              >
                <div className="h-full rounded-full bg-primary" style={{ width: `${progresso}%` }} />
                <div
                  className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 shadow transition-opacity group-hover/bar:opacity-100"
                  style={{ left: `${progresso}%` }}
                />
              </div>
              <span className="w-11 shrink-0 text-right text-xs font-medium tabular-nums text-white/80">
                {formatarTempo(duracao - tempoAtual)}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={alternarPlay}
                aria-label={tocando ? "Pausar" : "Reproduzir"}
                className="text-white transition-colors hover:text-white/70 cursor-pointer"
              >
                {tocando ? <IconePausar /> : <IconeTocar />}
              </button>
              <button
                type="button"
                onClick={() => pular(-15)}
                aria-label="Voltar 15 segundos"
                className="hidden text-white transition-colors hover:text-white/70 sm:block cursor-pointer"
              >
                <IconeVoltar15 />
              </button>
              <button
                type="button"
                onClick={() => pular(15)}
                aria-label="Avançar 15 segundos"
                className="hidden text-white transition-colors hover:text-white/70 sm:block cursor-pointer"
              >
                <IconeAvancar15 />
              </button>

              <div className="group/volume hidden items-center gap-2 sm:flex">
                <button
                  type="button"
                  onClick={alternarMudo}
                  aria-label={mudo ? "Ativar som" : "Mudo"}
                  className="text-white transition-colors hover:text-white/70 cursor-pointer"
                >
                  {mudo || volume === 0 ? <IconeMudo /> : <IconeVolume />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={mudo ? 0 : volume}
                  onChange={aoMudarVolume}
                  className="w-0 accent-accent opacity-0 transition-all duration-200 group-hover/volume:w-20 group-hover/volume:opacity-100"
                />
              </div>

              <span className="hidden text-xs font-medium tabular-nums text-white/70 md:inline">
                {formatarTempo(tempoAtual)} / {formatarTempo(duracao)}
              </span>

              {(titulo || subtitulo) && (
                <span className="ml-1 flex min-w-0 flex-1 items-center gap-1.5 truncate text-xs font-semibold text-white/70 sm:text-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icon.png" alt="Logo" className="h-5 w-5 rounded-sm object-cover shrink-0" />
                  {titulo}
                  {subtitulo ? ` · ${subtitulo}` : ""}
                </span>
              )}

              <button
                type="button"
                onClick={alternarTelaCheia}
                aria-label={telaCheia ? "Sair da tela cheia" : "Tela cheia"}
                className="ml-auto text-white transition-colors hover:text-white/70 cursor-pointer"
              >
                {telaCheia ? <IconeSairTelaCheia /> : <IconeTelaCheia />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function IconeTocar() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function IconePausar() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
}

function IconeVoltar15() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 12a8 8 0 1 1 2.6 5.9" strokeLinecap="round" />
      <path d="M4 6v5h5" strokeLinecap="round" strokeLinejoin="round" />
      <text x="12" y="15.5" fontSize="7.5" fill="currentColor" stroke="none" textAnchor="middle" fontFamily="sans-serif" fontWeight="700">
        15
      </text>
    </svg>
  );
}

function IconeAvancar15() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 12a8 8 0 1 0-2.6 5.9" strokeLinecap="round" />
      <path d="M20 6v5h-5" strokeLinecap="round" strokeLinejoin="round" />
      <text x="12" y="15.5" fontSize="7.5" fill="currentColor" stroke="none" textAnchor="middle" fontFamily="sans-serif" fontWeight="700">
        15
      </text>
    </svg>
  );
}

function IconeVolume() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 10v4h4l5 5V5L7 10H3z" />
      <path
        d="M16 8.5a4.5 4.5 0 0 1 0 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M18.5 6a8 8 0 0 1 0 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconeMudo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 10v4h4l5 5V5L7 10H3z" />
      <path
        d="M16 9l5 6M21 9l-5 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconeTelaCheia() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconeSairTelaCheia() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconeVoltar() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
