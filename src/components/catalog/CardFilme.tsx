"use client";

import Link from "next/link";
import { useState } from "react";
import type { Conteudo } from "@/types/database";
import { formatarPreco, isNovo } from "@/lib/catalogo";

type Variant = "carrossel" | "top12" | "grid";

const TAMANHOS: Record<"carrossel" | "top12", { largura: number; altura: number }> = {
  carrossel: { largura: 160, altura: 240 },
  top12: { largura: 180, altura: 270 },
};

export default function CardFilme({
  conteudo,
  rank,
  variant = "carrossel",
}: {
  conteudo: Conteudo;
  rank?: number;
  variant?: Variant;
}) {
  const [carregada, setCarregada] = useState(false);

  const generos = conteudo.ds_generos
    ?.split(",")
    .map((g) => g.trim())
    .filter(Boolean);
  const preco = formatarPreco(conteudo.vl_aluguel ?? conteudo.vl_vitalicio);
  const novo = isNovo(conteudo.dt_lancamento);

  const fixo = variant !== "grid";
  const mostraRank = variant === "top12" && typeof rank === "number";
  const { largura, altura } = TAMANHOS[variant === "top12" ? "top12" : "carrossel"];
  const escalaHover =
    variant === "top12" ? "group-hover/card:scale-[1.06]" : "group-hover/card:scale-[1.08]";

  return (
    <div
      className={`group/card relative flex items-end ${fixo ? "shrink-0" : "w-full"}`}
      style={fixo ? { width: mostraRank ? largura + 56 : largura } : undefined}
    >
      {mostraRank && (
        <span
          className="pointer-events-none relative z-0 -mr-8 shrink-0 select-none font-black leading-none text-white/[0.08]"
          style={{ fontSize: 96 }}
        >
          {rank}
        </span>
      )}

      <div
        className={`relative z-10 origin-bottom-left overflow-hidden rounded-[6px] bg-surface ring-1 ring-white/[0.08] transition-all duration-300 ease-out group-hover/card:z-20 group-hover/card:ring-2 group-hover/card:ring-accent group-hover/card:shadow-[0_8px_32px_rgba(123,47,190,0.5)] ${escalaHover} ${
          fixo ? "" : "aspect-[2/3] w-full"
        }`}
        style={fixo ? { width: largura, height: altura } : undefined}
      >
        {!carregada && conteudo.ds_url_poster && (
          <div className="absolute inset-0 animate-shimmer bg-[linear-gradient(110deg,#0d0a1a_30%,#18101f_50%,#0d0a1a_70%)]" />
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

        {novo && (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Novo
          </span>
        )}

        <span className="absolute right-1.5 top-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-foreground/90 backdrop-blur-sm">
          {conteudo.tp_formato}
        </span>

        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/95 via-black/30 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover/card:opacity-100">
          <button
            type="button"
            aria-label={`Assistir ${conteudo.nm_titulo}`}
            className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-white shadow-[0_4px_20px_rgba(123,47,190,0.6)] transition-transform hover:scale-110"
          >
            ▶
          </button>

          <Link
            href={`/filme/${conteudo.cd_conteudo}`}
            className="line-clamp-1 text-[13px] font-semibold text-foreground hover:underline"
          >
            {conteudo.nm_titulo}
          </Link>
          {generos && generos.length > 0 && (
            <p className="line-clamp-1 text-[11px] text-secondary">
              {generos.join(" • ")}
            </p>
          )}
          {preco && <p className="mt-0.5 text-xs font-semibold text-accent">{preco}</p>}
        </div>
      </div>
    </div>
  );
}
