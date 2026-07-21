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
}: {
  titulo: string;
  itens: Conteudo[];
  verTudoHref?: string;
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
    <section className="relative py-5">
      <div className="mb-3 flex items-center justify-between px-4 sm:px-8">
        <h2
          className="text-foreground text-[18px] font-bold"
          style={{
            borderLeft: "3px solid #7B2FBE",
            paddingLeft: "12px",
          }}
        >
          {titulo}
        </h2>
        {verTudoHref && (
          <Link
            href={verTudoHref}
            className="text-sm font-semibold text-[#9D4EDD] transition-colors hover:text-white"
          >
            Ver todos →
          </Link>
        )}
      </div>

      <div className="group/carrossel relative overflow-hidden">
        <StaggerGroup
          ref={trilhoRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] sm:px-8 [&::-webkit-scrollbar]:hidden"
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
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden h-10 w-10 items-center justify-center bg-[rgba(5,2,8,0.9)] border border-[rgba(139,92,246,0.3)] text-[#9D4EDD] rounded-[8px] text-2xl opacity-0 transition-opacity group-hover/carrossel:opacity-100 sm:flex cursor-pointer hover:bg-[#0D0A1A]"
        >
          ‹
        </motion.button>
        <motion.button
          type="button"
          aria-label="Próximo"
          onClick={() => rolar("direita")}
          {...buttonTap}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden h-10 w-10 items-center justify-center bg-[rgba(5,2,8,0.9)] border border-[rgba(139,92,246,0.3)] text-[#9D4EDD] rounded-[8px] text-2xl opacity-0 transition-opacity group-hover/carrossel:opacity-100 sm:flex cursor-pointer hover:bg-[#0D0A1A]"
        >
          ›
        </motion.button>
      </div>
    </section>
  );
}
