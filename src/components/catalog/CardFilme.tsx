"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { formatarPreco, formatarViews, obterPrecoCapa } from "@/lib/catalogo";
import { springExpressivo } from "@/lib/motion";
import { useSuportaHover } from "@/lib/useSuportaHover";
import PosterImg from "./PosterImg";

type Variant = "carrossel" | "top12" | "grid";

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
  conteudo: {
    cd_conteudo: string;
    nm_titulo: string;
    ds_url_poster: string | null;
    vl_aluguel: number | null;
    vl_vitalicio: number | null;
    nr_views?: number;
    /** Já incluso numa assinatura ativa do usuário — troca preço/Comprar
     * por Assistir direto, igual o bot já faz. */
    incluidoNaAssinatura?: boolean;
  };
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
  const suportaHover = useSuportaHover();
  const preco = formatarPreco(obterPrecoCapa(conteudo));
  const destino = href ?? `/filme/${conteudo.cd_conteudo}`;
  const incluido = !!conteudo.incluidoNaAssinatura;
  const destinoAssistir = `/assistir/${conteudo.cd_conteudo}`;

  const poster = (sizeClasses: string, className: string, largura: number) => (
    <div className={`relative overflow-hidden rounded-lg bg-surface ${sizeClasses} ${className}`}>
      {!carregada && conteudo.ds_url_poster && (
        <div className="absolute inset-0 animate-shimmer bg-[linear-gradient(110deg,#161616_30%,#222_50%,#161616_70%)]" />
      )}
      {conteudo.ds_url_poster ? (
        <PosterImg
          src={conteudo.ds_url_poster}
          largura={largura}
          alt={conteudo.nm_titulo}
          // Top12 é um conjunto pequeno e fixo (12) logo no topo da home —
          // carrega sem esperar entrar no viewport. Isso evita que, ao
          // recarregar a página com a rolagem restaurada pelo navegador
          // (volta pra onde o usuário estava), várias dessas imagens
          // "lazy" disparem o carregamento juntas de uma vez — um burst
          // de requisições simultâneas que o CDN do pôster derruba com
          // mais facilidade do que um carregamento espalhado no tempo.
          loading={variant === "top12" ? "eager" : "lazy"}
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
    return (
      <div className="flex items-center gap-2.5 lg:gap-4">
        <motion.div whileTap={{ scale: 0.95 }} className="relative shrink-0">
        <Link href={destino} className="relative block">
          {poster("w-[75px] h-[105px] lg:w-[130px] lg:h-[182px]", "", 260)}
          <span
            className={`absolute bottom-0 left-0 flex h-[25px] w-[25px] items-center justify-center rounded-tr-lg text-sm font-black lg:h-[34px] lg:w-[34px] lg:text-lg ${
              CORES_RANK[rank] ?? "bg-primary text-white"
            }`}
          >
            {rank}
          </span>
        </Link>
        </motion.div>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <Link
            href={destino}
            className="h-[30px] overflow-hidden line-clamp-2 text-[11px] font-bold leading-tight text-foreground lg:h-[42px] lg:text-base"
          >
            {conteudo.nm_titulo}
          </Link>

          {typeof conteudo.nr_views === "number" && conteudo.nr_views > 0 && (
            <p className="mt-0.5 text-[10px] font-medium text-emerald-400 lg:text-xs">
              {formatarViews(conteudo.nr_views)}
            </p>
          )}

          {incluido ? (
            <Link
              href={destinoAssistir}
              className="mt-1.5 flex w-fit items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-black text-black transition-transform active:scale-95 lg:px-4 lg:py-1.5 lg:text-xs"
            >
              ▶ Assistir
            </Link>
          ) : (
            <>
              {preco && <p className="mt-0.5 text-[11px] font-extrabold text-secondary lg:text-sm">{preco}</p>}
              <Link
                href={destino}
                className="mt-1.5 flex w-fit items-center gap-1 rounded-full bg-white px-3 py-1 text-[10px] font-black text-black transition-transform active:scale-95 lg:px-4 lg:py-1.5 lg:text-xs"
              >
                🛒 Comprar
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  const fixo = variant === "carrossel";

  return (
    <div className={fixo ? "shrink-0 w-[125px] lg:w-[230px]" : "w-full"}>
      <motion.div
        whileHover={suportaHover ? { scale: 1.08, transition: springExpressivo } : undefined}
        whileTap={{ scale: 0.96 }}
      >
        <Link href={destino} className="relative block">
          {poster(fixo ? "w-[125px] h-[185px] lg:w-[230px] lg:h-[340px]" : "aspect-[2/3] w-full", "cursor-pointer", 460)}
          {badge && (
            <span className="absolute left-1.5 top-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-foreground">
              {badge}
            </span>
          )}
        </Link>
      </motion.div>

      <Link
        href={destino}
        className="mt-2 h-[34px] overflow-hidden line-clamp-2 text-xs font-bold leading-tight text-foreground lg:h-[45px] lg:text-base"
      >
        {conteudo.nm_titulo}
      </Link>

      {legenda ? (
        <p className="mt-0.5 line-clamp-1 text-[11px] text-secondary lg:text-sm">{legenda}</p>
      ) : incluido ? (
        <Link
          href={destinoAssistir}
          className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-md bg-emerald-500 py-2 text-[10px] font-bold uppercase tracking-wide text-black transition-colors hover:bg-emerald-400 lg:py-2.5 lg:text-xs"
        >
          ▶ Assistir
        </Link>
      ) : (
        <>
          {preco && <p className="text-xs font-extrabold text-price lg:text-base">{preco}</p>}
          <Link
            href={destino}
            className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-md bg-white/15 py-2 text-[10px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-white/25 lg:py-2.5 lg:text-xs"
          >
            + Detalhes
          </Link>
        </>
      )}
    </div>
  );
}
