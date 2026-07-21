"use client";

import { useEffect, useRef, useState } from "react";

const RETOMAR_ATE_PORCENTAGEM = 0.95;
const SALVAR_PROGRESSO_INTERVALO_MS = 5000;

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

export default function VideoPlayer({
  src,
  poster,
  idProgresso,
  autoPlay = false,
}: {
  src: string;
  poster?: string | null;
  /** Chave única (ex: cd_conteudo ou cd_episodio) usada pra guardar "continuar assistindo". */
  idProgresso: string;
  autoPlay?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

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
      setCarregando(false);
    }

    function aoDarErro() {
      setErro("Não foi possível carregar o vídeo. Tente novamente em instantes.");
      setCarregando(false);
    }

    video.addEventListener("loadedmetadata", aoCarregarMetadados);
    video.addEventListener("error", aoDarErro);

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
      }
    }, SALVAR_PROGRESSO_INTERVALO_MS);

    function aoPausar() {
      if (video) salvarProgresso(idProgresso, video.currentTime);
    }
    function aoTerminar() {
      salvarProgresso(idProgresso, 0);
    }

    video.addEventListener("pause", aoPausar);
    video.addEventListener("ended", aoTerminar);

    return () => {
      destruido = true;
      window.clearInterval(intervalo);
      video.removeEventListener("loadedmetadata", aoCarregarMetadados);
      video.removeEventListener("error", aoDarErro);
      video.removeEventListener("pause", aoPausar);
      video.removeEventListener("ended", aoTerminar);
      if (video.currentTime > 0) salvarProgresso(idProgresso, video.currentTime);
      hls?.destroy();
    };
  }, [src, idProgresso]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black select-none">
      <video
        ref={videoRef}
        poster={poster ?? undefined}
        controls
        autoPlay={autoPlay}
        playsInline
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        className="h-full w-full"
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
    </div>
  );
}
