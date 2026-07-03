"use client";

import Link from "next/link";
import { useRef } from "react";
import type { Conteudo } from "@/types/database";
import CardFilme from "./CardFilme";

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
        <h2 className="text-[20px] font-bold text-foreground">{titulo}</h2>
        {verTudoHref && (
          <Link
            href={verTudoHref}
            className="text-sm font-semibold text-secondary transition-colors hover:text-primary"
          >
            Ver tudo →
          </Link>
        )}
      </div>

      <div className="group/carrossel relative">
        <div
          ref={trilhoRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] sm:px-8 [&::-webkit-scrollbar]:hidden"
        >
          {itens.map((item) => (
            <div key={item.cd_conteudo} className="snap-start">
              <CardFilme conteudo={item} variant="carrossel" />
            </div>
          ))}
        </div>

        <button
          type="button"
          aria-label="Anterior"
          onClick={() => rolar("esquerda")}
          className="absolute left-0 top-0 z-20 hidden h-full w-10 items-center justify-center bg-gradient-to-r from-background to-transparent text-2xl text-foreground opacity-0 transition-opacity group-hover/carrossel:opacity-100 sm:flex"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Próximo"
          onClick={() => rolar("direita")}
          className="absolute right-0 top-0 z-20 hidden h-full w-10 items-center justify-center bg-gradient-to-l from-background to-transparent text-2xl text-foreground opacity-0 transition-opacity group-hover/carrossel:opacity-100 sm:flex"
        >
          ›
        </button>
      </div>
    </section>
  );
}
