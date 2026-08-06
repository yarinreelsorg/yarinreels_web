"use client";

import { useEffect, useRef } from "react";
import type { Conteudo } from "@/types/database";
import CardFilme from "./CardFilme";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";
import { buttonTap } from "@/lib/motion";
import { motion } from "motion/react";

export default function Top12({ itens }: { itens: Conteudo[] }) {
  const trilhoRef = useRef<HTMLDivElement>(null);
  const pausadoRef = useRef(false);

  useEffect(() => {
    if (itens.length <= 1) return;

    const id = setInterval(() => {
      const trilho = trilhoRef.current;
      if (!trilho || pausadoRef.current) return;

      const largura = trilho.firstElementChild?.clientWidth ?? trilho.clientWidth;
      const gap = 20;
      const fim = trilho.scrollWidth - trilho.clientWidth;
      const proximo = trilho.scrollLeft + largura + gap;

      trilho.scrollTo({
        left: proximo > fim + 10 ? 0 : proximo,
        behavior: "smooth",
      });
    }, 5000);

    return () => clearInterval(id);
  }, [itens.length]);

  if (itens.length === 0) return null;

  function pausar() {
    pausadoRef.current = true;
  }

  function retomar() {
    setTimeout(() => {
      pausadoRef.current = false;
    }, 4000);
  }

  function rolar(direcao: "esquerda" | "direita") {
    const trilho = trilhoRef.current;
    if (!trilho) return;
    const distancia = trilho.clientWidth * 0.9;
    trilho.scrollBy({
      left: direcao === "esquerda" ? -distancia : distancia,
      behavior: "smooth",
    });
  }

  return (
    <section className="py-5">
      <div className="mb-4 flex items-center justify-between px-4 sm:px-8">
        <h2 className="flex items-center gap-1.5 text-lg font-black text-foreground">
          Top 12 <span>🔥</span>
        </h2>
        <div className="flex items-center gap-2 lg:hidden">
          <motion.button
            type="button"
            aria-label="Anterior"
            onClick={() => rolar("esquerda")}
            {...buttonTap}
            className="flex h-5 w-5 items-center justify-center rounded-full border border-white/15 text-xs text-secondary transition-colors hover:text-foreground cursor-pointer sm:h-6 sm:w-6 sm:text-sm"
          >
            ‹
          </motion.button>
          <motion.button
            type="button"
            aria-label="Próximo"
            onClick={() => rolar("direita")}
            {...buttonTap}
            className="flex h-5 w-5 items-center justify-center rounded-full border border-white/15 text-xs text-secondary transition-colors hover:text-foreground cursor-pointer sm:h-6 sm:w-6 sm:text-sm"
          >
            ›
          </motion.button>
        </div>
      </div>

      <StaggerGroup
        ref={trilhoRef}
        onPointerDown={pausar}
        onPointerUp={retomar}
        onMouseEnter={pausar}
        onMouseLeave={retomar}
        className="grid snap-x snap-mandatory grid-flow-col grid-rows-3 gap-x-3 gap-y-4 overflow-x-auto scroll-smooth px-4 pb-2 [grid-auto-columns:min(calc(50vw-15px),270px)] [scrollbar-width:none] sm:px-8 lg:grid-rows-2 lg:gap-x-5 lg:gap-y-6 lg:[grid-auto-columns:440px] [&::-webkit-scrollbar]:hidden"
        staggerChildren={0.04}
      >
        {itens.slice(0, 12).map((item, index) => (
          <StaggerItem key={item.cd_conteudo} className="snap-start">
            <CardFilme conteudo={item} variant="top12" rank={index + 1} />
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}
