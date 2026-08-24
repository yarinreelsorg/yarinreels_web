"use client";

import { useState } from "react";
import { otimizarUrlPoster } from "@/lib/catalogo";

const ATRASO_RETRY_MS = 600;

interface PosterImgProps {
  src: string;
  largura: number;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  onLoad?: () => void;
}

/**
 * <img> de pôster com retry + fallback automático: se a versão
 * redimensionada (=wNNN, ver otimizarUrlPoster) falhar — o CDN do Google às
 * vezes recusa/limita a requisição de resize, às vezes é só uma falha de
 * rede passageira — espera um instante e tenta de novo antes de cair pra
 * URL original, em vez de deixar a capa em branco na primeira falha.
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
    if (tentativa === 0) {
      // Falha de rede passageira é comum — espera um instante e tenta de
      // novo a mesma URL antes de desistir dela. O "key" abaixo muda com
      // `tentativa`, forçando o navegador a refazer a requisição do zero.
      setTimeout(() => setTentativa(1), ATRASO_RETRY_MS);
      return;
    }
    if (!usarFallback) {
      setUsarFallback(true);
      setTentativa(0);
    }
    // se a URL original também falhar depois do fallback, desiste — já
    // tentou o razoável sem arriscar loop de requisições.
  }

  const url = usarFallback ? src : otimizarUrlPoster(src, largura);

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
