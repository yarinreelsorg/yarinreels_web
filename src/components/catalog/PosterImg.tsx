"use client";

import { useState } from "react";
import Image from "next/image";
import { otimizarUrlPoster } from "@/lib/catalogo";

const ATRASO_RETRY_MS = 1000;

interface PosterImgProps {
  src: string;
  largura: number;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  onLoad?: () => void;
  /** Prioridade de rede máxima (preload + fetchpriority=high) — reservar
   * só pra imagem que É o LCP de verdade (ex: primeiro slide do
   * HeroBanner). Antes vinha junto de loading="eager", então TODAS as
   * capas eager (as 12 do Top 12, por exemplo) brigavam por prioridade
   * máxima ao mesmo tempo — provável causa do PageSpeed não conseguir
   * nem detectar qual elemento era o LCP. */
  priority?: boolean;
  /** Hint de tamanho real renderizado (CSS), responsivo por breakpoint —
   * ex: "(min-width: 1024px) 230px, 125px". Sem isso, o next/image não
   * sabe que o card é bem menor no celular e sempre baixa a variante do
   * tamanho de DESKTOP (`largura`) pra todo mundo — é a causa raiz do
   * "economia estimada" gigante de imagem que o PageSpeed reporta.
   * Cai pra "${largura}px" fixo só se o chamador não informar. */
  sizes?: string;
}

/**
 * Pôster via next/image em vez de <img> direto pro CDN do Blogger — a
 * Vercel busca a imagem original UMA vez, otimiza e guarda no próprio
 * cache (30 dias, ver next.config.ts), então todo visitante depois do
 * primeiro passa a ser servido por esse cache em vez de depender
 * diretamente do Blogger a cada carregamento de página. Isso ataca a
 * causa raiz do "capa quebrada" (esse CDN historicamente derruba conexão
 * sob concorrência — testado direto), em vez de só mascarar com retry.
 *
 * Ainda assim mantém uma tentativa extra + um último recurso (<img>
 * direto pro Blogger, resolução reduzida) pro caso raro do próprio
 * proxy da Vercel falhar nessa primeira busca.
 *
 * `key={src}` força o React a criar uma instância nova (e portanto zerar
 * o estado de erro) sempre que a URL muda — sem isso, se o React
 * reaproveitar o componente pra uma capa diferente (mesma posição na
 * lista após filtro/navegação), o erro de uma imagem anterior "vaza"
 * pra imagem nova.
 */
export default function PosterImg(props: PosterImgProps) {
  return <PosterImgComEstado key={props.src} {...props} />;
}

function PosterImgComEstado({
  src,
  largura,
  alt,
  className,
  loading = "lazy",
  onLoad,
  sizes,
  priority = false,
}: PosterImgProps) {
  const [tentativa, setTentativa] = useState(0);
  const [ultimoRecurso, setUltimoRecurso] = useState(false);

  function aoDarErro() {
    if (tentativa === 0) {
      setTimeout(() => setTentativa(1), ATRASO_RETRY_MS);
      return;
    }
    setUltimoRecurso(true);
  }

  if (ultimoRecurso) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={otimizarUrlPoster(src, largura) ?? undefined}
        alt={alt}
        loading={loading}
        onLoad={onLoad}
        className={className}
      />
    );
  }

  return (
    <Image
      key={tentativa}
      src={src}
      alt={alt}
      fill
      sizes={sizes ?? `${largura}px`}
      priority={priority}
      loading={priority ? undefined : loading}
      onLoad={onLoad}
      onError={aoDarErro}
      className={className}
    />
  );
}
