"use client";

import Link from "next/link";
import { useState } from "react";
import { formatarPreco } from "@/lib/catalogo";

type Variant = "carrossel" | "top12" | "grid";

const TAMANHO_CARROSSEL = { largura: 125, altura: 185 };
const TAMANHO_TOP12_THUMB = { largura: 75, altura: 105 };

const CORES_RANK: Record<number, string> = {
  1: "bg-gradient-to-br from-yellow-400 to-amber-500 text-black",
  2: "bg-gradient-to-br from-gray-300 to-gray-400 text-black",
  3: "bg-gradient-to-br from-orange-500 to-orange-700 text-white",
};

export default function CardFilme({
  conteudo,
  rank,
  variant = "carrossel",
  href,
  legenda,
  badge,
}: {
  conteudo: { cd_conteudo: string; nm_titulo: string; ds_url_poster: string | null; vl_aluguel: number | null; vl_vitalicio: number | null };
  rank?: number;
  variant?: Variant;
  /** Sobrescreve o destino do pôster/botão (padrão: /filme/[id]). */
  href?: string;
  /** Texto fixo embaixo do pôster (ex: "3 dias restantes"), no lugar do preço/botão. */
  legenda?: string;
  /** Selo no canto do pôster (ex: "Alugado", "Vitalício", "Expirado"). */
  badge?: string;
}) {
  const [carregada, setCarregada] = useState(false);
  const preco = formatarPreco(conteudo.vl_aluguel ?? conteudo.vl_vitalicio);
  const destino = href ?? `/filme/${conteudo.cd_conteudo}`;

  const poster = (largura: number, altura: number, fixo: boolean, className: string) => (
    <div
      className={`relative overflow-hidden rounded-lg bg-surface ${fixo ? "" : "aspect-[2/3] w-full"} ${className}`}
      style={fixo ? { width: largura, height: altura } : undefined}
    >
      {!carregada && conteudo.ds_url_poster && (
        <div className="absolute inset-0 animate-shimmer bg-[linear-gradient(110deg,#161616_30%,#222_50%,#161616_70%)]" />
      )}
      {conteudo.ds_url_poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={conteudo.ds_url_poster}
          alt={conteudo.nm_titulo}
          loading="lazy"
          onLoad={() => setCarregada(true)}
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            carregada ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-secondary">
          {conteudo.nm_titulo}
        </div>
      )}
    </div>
  );

  if (variant === "top12" && typeof rank === "number") {
    const { largura, altura } = TAMANHO_TOP12_THUMB;
    return (
      <div className="flex items-center gap-2.5">
        <Link href={destino} className="relative shrink-0">
          {poster(largura, altura, true, "")}
          <span
            className={`absolute bottom-0 left-0 flex h-[25px] w-[25px] items-center justify-center rounded-tr-lg text-sm font-black ${
              CORES_RANK[rank] ?? "bg-primary text-white"
            }`}
          >
            {rank}
          </span>
        </Link>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <Link href={destino} className="line-clamp-2 text-[11px] font-bold leading-tight text-foreground">
            {conteudo.nm_titulo}
          </Link>
          {preco && <p className="mt-1 text-[11px] font-extrabold text-secondary">{preco}</p>}
          <Link
            href={destino}
            className="mt-2 flex w-fit items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[10px] font-black text-black transition-transform active:scale-95"
          >
            🛒 Comprar
          </Link>
        </div>
      </div>
    );
  }

  const fixo = variant === "carrossel";
  const { largura, altura } = TAMANHO_CARROSSEL;

  return (
    <div className={fixo ? "shrink-0" : "w-full"} style={fixo ? { width: largura } : undefined}>
      <Link href={destino} className="relative block">
        {poster(largura, altura, fixo, "cursor-pointer")}
        {badge && (
          <span className="absolute left-1.5 top-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-foreground">
            {badge}
          </span>
        )}
      </Link>

      <Link href={destino} className="mt-2 block line-clamp-1 text-xs font-bold text-foreground">
        {conteudo.nm_titulo}
      </Link>

      {legenda ? (
        <p className="mt-0.5 line-clamp-1 text-[11px] text-secondary">{legenda}</p>
      ) : (
        <>
          {preco && <p className="text-xs font-extrabold text-price">{preco}</p>}
          <Link
            href={destino}
            className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-md bg-white/15 py-2 text-[10px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-white/25"
          >
            + Detalhes
          </Link>
        </>
      )}
    </div>
  );
}
