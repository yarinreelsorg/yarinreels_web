"use client";

import { useState } from "react";
import { otimizarUrlPoster } from "@/lib/catalogo";

// Atraso crescente entre tentativas da versão redimensionada — o CDN do
// Google (blogger.googleusercontent.com) parece derrubar conexão sob
// carga (muitas capas pedindo ao mesmo tempo, ex: Top12 + carrosséis
// todos na home), então esperar um pouco mais a cada tentativa dá tempo
// do burst inicial de requisições esvaziar antes de tentar de novo.
const ATRASOS_RETRY_MS = [500, 1500, 3000];

interface PosterImgProps {
  src: string;
  largura: number;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  onLoad?: () => void;
}

/**
 * <img> de pôster com retry + fallback automático. A versão redimensionada
 * (=wNNN, ver otimizarUrlPoster) é sempre a aposta melhor — além de mais
 * leve, é a que mais confiavelmente carrega; a URL original (sem =wNNN)
 * costuma ser um JPEG/PNG de vários MB e, na prática, falha sozinha com
 * mais frequência que a redimensionada. Por isso insiste bastante na
 * versão redimensionada antes de cair pra original como último recurso,
 * em vez de escalar cedo demais pra uma fonte pior.
 *
 * `key={src}` força o React a criar uma instância nova (e portanto zerar
 * usarFallback/tentativa) sempre que a URL muda — sem isso, se o React
 * reaproveitar o componente pra uma capa diferente (mesma posição na
 * lista após filtro/navegação), o fallback de uma imagem anterior "vaza"
 * pra imagem nova.
 */
export default function PosterImg(props: PosterImgProps) {
  return <PosterImgComEstado key={props.src} {...props} />;
}

function PosterImgComEstado({ src, largura, alt, className, loading = "lazy", onLoad }: PosterImgProps) {
  const [usarFallback, setUsarFallback] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  function aoDarErro() {
    if (tentativa < ATRASOS_RETRY_MS.length) {
      // O "key" abaixo muda com `tentativa`, forçando o navegador a refazer
      // a requisição do zero em vez de reusar uma conexão já derrubada.
      setTimeout(() => setTentativa((t) => t + 1), ATRASOS_RETRY_MS[tentativa]);
      return;
    }
    if (!usarFallback) {
      setUsarFallback(true);
      setTentativa(0);
      return;
    }
    // se a URL original também falhar depois de esgotar as tentativas da
    // redimensionada, desiste — já tentou o razoável sem arriscar loop.
  }

  const urlBase = usarFallback ? src : otimizarUrlPoster(src, largura);
  // A partir da 1ª retentativa, força bypass do cache HTTP do navegador —
  // se a requisição original falhou no meio (conexão derrubada, comum
  // nesse CDN), o navegador às vezes guarda essa resposta quebrada/vazia
  // em cache; sem isso, TODA retentativa (e toda visita futura, inclusive
  // depois de recarregar a página) bateria nesse mesmo cache ruim em vez
  // de ir de novo pra rede.
  const url = urlBase && tentativa > 0 ? `${urlBase}?cb=${tentativa}` : urlBase;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={`${usarFallback ? "fallback" : "otimizada"}-${tentativa}`}
      src={url ?? undefined}
      alt={alt}
      loading={loading}
      onLoad={onLoad}
      onError={aoDarErro}
      className={className}
    />
  );
}
