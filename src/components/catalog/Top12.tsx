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
  const arrastoRef = useRef<{ x: number; scrollLeft: number; moveu: boolean } | null>(null);
  // Sobrevive ao "arrastoRef" ser zerado no pointerup, pra o handler de
  // click (disparado depois) ainda saber que aquilo foi um arraste.
  const moveuNoArrasteRef = useRef(false);

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

  // Toque já rola nativamente (scroll horizontal por gesto), mas no
  // desktop "overflow-x-auto" só responde a scroll do mouse/trackpad —
  // não dá pra "puxar pro lado" clicando e arrastando, que é o gesto mais
  // intuitivo. Implementa esse arraste manualmente só pra ponteiro tipo
  // mouse (touch/caneta usam o scroll nativo, sem interferência).
  function aoPressionarPonteiro(e: React.PointerEvent<HTMLDivElement>) {
    pausar();
    if (e.pointerType !== "mouse") return;
    const trilho = trilhoRef.current;
    if (!trilho) return;
    arrastoRef.current = { x: e.clientX, scrollLeft: trilho.scrollLeft, moveu: false };
    moveuNoArrasteRef.current = false;
    trilho.setPointerCapture(e.pointerId);
  }

  function aoMoverPonteiro(e: React.PointerEvent<HTMLDivElement>) {
    const estado = arrastoRef.current;
    const trilho = trilhoRef.current;
    if (!estado || !trilho) return;
    const delta = e.clientX - estado.x;
    if (Math.abs(delta) > 3) {
      estado.moveu = true;
      moveuNoArrasteRef.current = true;
    }
    trilho.scrollLeft = estado.scrollLeft - delta;
  }

  function aoSoltarPonteiro(e: React.PointerEvent<HTMLDivElement>) {
    retomar();
    const trilho = trilhoRef.current;
    if (arrastoRef.current && trilho) trilho.releasePointerCapture(e.pointerId);
    arrastoRef.current = null;
  }

  // Depois de um arraste de verdade (não um simples clique), o "click"
  // que o navegador dispara em seguida no card por baixo do cursor não
  // deve navegar — senão soltar o mouse depois de arrastar abre o filme
  // por baixo sem querer.
  function aoClicarDepoisDeArrastar(e: React.MouseEvent<HTMLDivElement>) {
    if (moveuNoArrasteRef.current) {
      e.preventDefault();
      e.stopPropagation();
      moveuNoArrasteRef.current = false;
    }
  }

  return (
    <section className="py-5">
      <div className="mb-4 flex items-center justify-between px-4 sm:px-8">
        <h2 className="flex items-center gap-1.5 text-lg font-black text-foreground">
          Top 12 <span>🔥</span>
        </h2>
        <div className="flex items-center gap-2">
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
        onPointerDown={aoPressionarPonteiro}
        onPointerMove={aoMoverPonteiro}
        onPointerUp={aoSoltarPonteiro}
        onPointerCancel={aoSoltarPonteiro}
        onClickCapture={aoClicarDepoisDeArrastar}
        onMouseEnter={pausar}
        onMouseLeave={retomar}
        className="grid snap-x snap-mandatory grid-flow-col grid-rows-3 gap-x-3 gap-y-4 overflow-x-auto scroll-smooth px-4 pb-2 [grid-auto-columns:min(calc(50vw-15px),270px)] [scrollbar-width:none] sm:px-8 lg:cursor-grab lg:select-none lg:grid-rows-2 lg:gap-x-5 lg:gap-y-6 lg:[grid-auto-columns:440px] lg:active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
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
