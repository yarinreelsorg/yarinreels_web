"use client";

import Link from "next/link";
import { useState } from "react";
import type { Conteudo } from "@/types/database";
import { formatarPreco, calcularRating, isNovo } from "@/lib/catalogo";
import Estrelas from "./Estrelas";

type Variant = "carrossel" | "top12" | "grid";

const TAMANHOS: Record<"carrossel" | "top12", { largura: number; altura: number }> = {
  carrossel: { largura: 170, altura: 255 },
  top12: { largura: 200, altura: 300 },
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
  const rating = calcularRating(conteudo.nr_views);
  const novo = isNovo(conteudo.dt_lancamento);

  const fixo = variant !== "grid";
  const gigante = variant === "top12" && typeof rank === "number";
  const { largura, altura } = TAMANHOS[variant === "top12" ? "top12" : "carrossel"];

  return (
    <div
      className={`group/card relative ${fixo ? "shrink-0" : "w-full"}`}
      style={fixo ? { width: gigante ? largura + 50 : largura } : undefined}
    >
      {gigante && (
        <span
          className="pointer-events-none absolute -left-1 bottom-0 z-0 select-none text-[120px] font-black leading-none text-transparent [-webkit-text-stroke:2px_rgba(139,92,246,0.35)]"
          aria-hidden
        >
          {rank}
        </span>
      )}

      <div
        className={`relative z-10 overflow-hidden rounded-[8px] bg-[#150c28] ring-1 ring-white/5 transition-all duration-300 ease-out group-hover/card:z-20 group-hover/card:scale-[1.08] group-hover/card:shadow-[0_18px_40px_rgba(139,92,246,0.45)] group-hover/card:ring-2 group-hover/card:ring-primary ${
          gigante ? "ml-auto" : ""
        } ${fixo ? "" : "aspect-[2/3] w-full"}`}
        style={fixo ? { width: largura, height: altura } : undefined}
      >
        {!carregada && conteudo.ds_url_poster && (
          <div className="absolute inset-0 animate-shimmer bg-[linear-gradient(110deg,#150c28_30%,#2a1a4a_50%,#150c28_70%)]" />
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

        <span className="absolute right-1.5 top-1.5 rounded border border-[rgba(139,92,246,0.5)] bg-[rgba(139,92,246,0.2)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-foreground backdrop-blur-sm">
          {conteudo.tp_formato}
        </span>

        {novo && (
          <span className="absolute left-1.5 top-1.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-[0_0_12px_rgba(139,92,246,0.6)]">
            Novo
          </span>
        )}

        <div className="absolute inset-0 flex flex-col justify-end gap-1.5 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-2.5 opacity-0 transition-opacity duration-200 group-hover/card:opacity-100">
          <Link
            href={`/filme/${conteudo.cd_conteudo}`}
            className="line-clamp-2 text-[14px] font-semibold text-foreground hover:underline"
          >
            {conteudo.nm_titulo}
          </Link>
          {generos && generos.length > 0 && (
            <p className="line-clamp-1 text-[11px] text-secondary">
              {generos.join(" • ")}
            </p>
          )}
          <Estrelas rating={rating} />
          {preco && <p className="text-xs font-bold text-primary">{preco}</p>}

          <div className="mt-1 flex items-center gap-1.5">
            <Link
              href={`/assistir/${conteudo.cd_conteudo}`}
              className="flex-1 rounded bg-primary px-2 py-1 text-center text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              ▶ Assistir
            </Link>
            <button
              type="button"
              aria-label="Adicionar à Minha Lista"
              className="rounded border border-secondary/40 px-2 py-1 text-xs font-semibold text-secondary transition-colors hover:border-primary hover:text-primary"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
