"use client";

import { useState } from "react";
import { otimizarUrlPoster } from "@/lib/catalogo";

/**
 * <img> de pôster com fallback automático: se a versão redimensionada
 * (=wNNN, ver otimizarUrlPoster) falhar — o CDN do Google às vezes
 * recusa/limita a requisição de resize — troca pra URL original em vez de
 * deixar a capa em branco pra sempre.
 */
export default function PosterImg({
  src,
  largura,
  alt,
  className,
  loading = "lazy",
  onLoad,
}: {
  src: string;
  largura: number;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  onLoad?: () => void;
}) {
  const [usarFallback, setUsarFallback] = useState(false);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={(usarFallback ? src : otimizarUrlPoster(src, largura)) ?? undefined}
      alt={alt}
      loading={loading}
      onLoad={onLoad}
      onError={() => {
        if (!usarFallback) setUsarFallback(true);
      }}
      className={className}
    />
  );
}
