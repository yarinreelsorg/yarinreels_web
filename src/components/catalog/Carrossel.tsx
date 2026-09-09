"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion } from "motion/react";
import type { Conteudo } from "@/types/database";
import CardFilme from "./CardFilme";
import { buttonTap } from "@/lib/motion";

export default function Carrossel({
  titulo,
  itens,
  verTudoHref,
  discreto = false,
}: {
  titulo: string;
  itens: Conteudo[];
  verTudoHref?: string;
  discreto?: boolean;
}) {
  const trilhoRef = useRef<HTMLDivElement>(null);

  if (itens.length === 0) return null;

  function rolar(direcao: "esquerda" | "direita") {
    const trilho = trilhoRef.current;
    if (!trilho) return;
    const distancia = trilho.clientWidth * 0.85;
    trilho.scrollBy({
      left: direcao === "esquerda" ? -distancia : distancia,
      behavior: "smooth",
    });
  }

  return (
    <section className={discreto ? "relative py-3" : "relative py-5"}>
      <div className="mb-3 flex items-center justify-between px-4 sm:px-8">
        <h2
          className={
            discreto
              ? "text-[13px] font-bold text-secondary"
              : "text-[17px] font-black text-foreground"
          }
        >
          {titulo}
        </h2>
        {verTudoHref && (
          <Link
            href={verTudoHref}
            className="text-sm font-bold text-primary transition-colors hover:text-white"
          >
            Ver tudo →
          </Link>
        )}
      </div>

      {/* Sem animação de entrada (fadeUp) nos cards: o slide vertical
          (y:32 → 0) somado ao overflow-hidden que essa fileira precisa
          pra rolagem horizontal cortava um pedaço da capa bem no meio da
          animação — trocado por divs simples, sem motion. */}
      <div className="group/carrossel relative">
        <div
          ref={trilhoRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] sm:px-8 lg:gap-4 [&::-webkit-scrollbar]:hidden"
        >
          {itens.map((item) => (
            <div key={item.cd_conteudo} className="snap-start">
              <CardFilme conteudo={item} variant="carrossel" />
            </div>
          ))}
        </div>

        <motion.button
          type="button"
          aria-label="Anterior"
          onClick={() => rolar("esquerda")}
          {...buttonTap}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden h-10 w-10 items-center justify-center bg-black/90 border border-white/15 text-foreground rounded-[8px] text-2xl opacity-0 transition-opacity group-hover/carrossel:opacity-100 sm:flex cursor-pointer hover:bg-surface"
        >
          ‹
        </motion.button>
        <motion.button
          type="button"
          aria-label="Próximo"
          onClick={() => rolar("direita")}
          {...buttonTap}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden h-10 w-10 items-center justify-center bg-black/90 border border-white/15 text-foreground rounded-[8px] text-2xl opacity-0 transition-opacity group-hover/carrossel:opacity-100 sm:flex cursor-pointer hover:bg-surface"
        >
          ›
        </motion.button>
      </div>
    </section>
  );
}
