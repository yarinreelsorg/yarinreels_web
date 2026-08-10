"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion } from "motion/react";
import type { Conteudo } from "@/types/database";
import CardFilme from "./CardFilme";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";
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

      <div className="group/carrossel relative overflow-hidden">
        <StaggerGroup
          ref={trilhoRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] sm:px-8 lg:gap-4 [&::-webkit-scrollbar]:hidden"
          staggerChildren={0.04}
        >
          {itens.map((item) => (
            <StaggerItem key={item.cd_conteudo} className="snap-start">
              <CardFilme conteudo={item} variant="carrossel" />
            </StaggerItem>
          ))}
        </StaggerGroup>

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
