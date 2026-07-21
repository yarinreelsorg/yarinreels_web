"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import type { Conteudo } from "@/types/database";
import { formatarPreco, formatarViews } from "@/lib/catalogo";
import { springExpressivo } from "@/lib/motion";

type Variant = "carrossel" | "top12" | "grid";

const TAMANHOS: Record<"carrossel" | "top12", { largura: number; altura: number }> = {
  carrossel: { largura: 160, altura: 240 },
  top12: { largura: 180, altura: 270 },
};

const subDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
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

  // Badge NOVO vermelho para conteúdos com dt_lancamento dos últimos 30 dias
  // verificar com new Date(c.dt_lancamento) > subDays(new Date(), 30)
  const novo = conteudo.dt_lancamento
    ? new Date(conteudo.dt_lancamento) > subDays(new Date(), 30)
    : false;

  const fixo = variant !== "grid";
  const mostraRank = variant === "top12" && typeof rank === "number";
  const { largura, altura } = TAMANHOS[variant === "top12" ? "top12" : "carrossel"];

  return (
    <motion.div
      className={`group/card relative flex items-end ${fixo ? "shrink-0" : "w-full"}`}
      style={fixo ? { width: largura } : undefined}
      whileHover={{ scale: 1.08, zIndex: 20 }}
      whileTap={{ scale: 0.97 }}
      transition={springExpressivo}
    >
      {/* Ranking numbers overlaid on bottom left */}
      {mostraRank && (
        <span
          className="pointer-events-none absolute bottom-[-10px] left-[-10px] z-30 select-none font-black leading-none text-white/[0.07]"
          style={{
            fontSize: "80px",
            fontWeight: 900,
            WebkitTextStroke: "1px rgba(139,92,246,0.3)",
          }}
        >
          {rank}
        </span>
      )}

      {/* Card Body */}
      <div
        className={`relative z-10 origin-bottom-left overflow-hidden rounded-[8px] bg-surface transition-all duration-[250ms] ease-out border-2 border-transparent group-hover/card:border-[rgba(139,92,246,0.6)] group-hover/card:shadow-[0_8px_32px_rgba(123,47,190,0.4)] ${
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

        {/* Badge NOVO vermelho */}
        {novo && (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white z-10">
            Novo
          </span>
        )}

        {/* Badge de formato canto superior direito */}
        <span
          className="absolute right-1.5 top-1.5 rounded-full px-2 py-0.5 font-medium uppercase tracking-wide text-foreground/90 backdrop-blur-sm z-10"
          style={{
            background: "rgba(0,0,0,0.7)",
            border: "1px solid rgba(139,92,246,0.4)",
            fontSize: "9px",
          }}
        >
          {conteudo.tp_formato}
        </span>

        {/* Hover overlay bottom with gradient rgba(5,2,8,0) to rgba(5,2,8,0.95) */}
        <div
          className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 transition-opacity duration-200 group-hover/card:opacity-100"
          style={{
            backgroundImage: "linear-gradient(to top, rgba(5,2,8,0.95) 0%, rgba(5,2,8,0) 100%)",
          }}
        >
          {/* Botão play circular 40px roxo centralizado */}
          <Link
            href={`/filme/${conteudo.cd_conteudo}`}
            aria-label={`Assistir ${conteudo.nm_titulo}`}
            className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#7B2FBE] text-white shadow-[0_4px_20px_rgba(123,47,190,0.6)] transition-transform hover:scale-110 cursor-pointer"
          >
            ▶
          </Link>

          <Link
            href={`/filme/${conteudo.cd_conteudo}`}
            className="line-clamp-1 text-[13px] font-semibold text-foreground hover:underline"
          >
            {conteudo.nm_titulo}
          </Link>
          {generos && generos.length > 0 && (
            <p className="line-clamp-1 text-[11px] text-[#A78BFA]">
              {generos.join(" • ")}
            </p>
          )}
          {preco && <p className="mt-0.5 text-xs font-semibold text-[#9D4EDD]">{preco}</p>}
        </div>
      </div>
    </motion.div>
  );
}
