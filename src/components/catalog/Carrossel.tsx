"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Conteudo } from "@/types/database";
import CardFilme from "./CardFilme";

const LARGURA_CARD = 170;
const GAP = 12;

export default function Carrossel({
  titulo,
  itens,
  verTudoHref,
}: {
  titulo: string;
  itens: Conteudo[];
  verTudoHref?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pagina, setPagina] = useState(0);
  const [porPagina, setPorPagina] = useState(6);

  useEffect(() => {
    function medir() {
      const largura = containerRef.current?.clientWidth ?? 0;
      const qtd = Math.max(
        1,
        Math.floor((largura + GAP) / (LARGURA_CARD + GAP))
      );
      setPorPagina(qtd);
    }
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);

  if (itens.length === 0) return null;

  const totalPaginas = Math.max(1, Math.ceil(itens.length / porPagina));
  const paginaAtual = Math.min(pagina, totalPaginas - 1);
  const deslocamento = paginaAtual * porPagina * (LARGURA_CARD + GAP);

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

      <div className="group/carrossel relative px-4 sm:px-8">
        <div ref={containerRef} className="overflow-hidden">
          <div
            className="flex gap-3 transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${deslocamento}px)` }}
          >
            {itens.map((item) => (
              <CardFilme
                key={item.cd_conteudo}
                conteudo={item}
                variant="carrossel"
              />
            ))}
          </div>
        </div>

        {paginaAtual > 0 && (
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => setPagina((p) => Math.max(0, p - 1))}
            className="absolute left-4 top-0 z-20 hidden h-full w-10 items-center justify-center bg-gradient-to-r from-background to-transparent text-2xl text-foreground opacity-0 transition-opacity group-hover/carrossel:opacity-100 sm:left-8 sm:flex"
          >
            ‹
          </button>
        )}
        {paginaAtual < totalPaginas - 1 && (
          <button
            type="button"
            aria-label="Próximo"
            onClick={() =>
              setPagina((p) => Math.min(totalPaginas - 1, p + 1))
            }
            className="absolute right-4 top-0 z-20 hidden h-full w-10 items-center justify-center bg-gradient-to-l from-background to-transparent text-2xl text-foreground opacity-0 transition-opacity group-hover/carrossel:opacity-100 sm:right-8 sm:flex"
          >
            ›
          </button>
        )}
      </div>
    </section>
  );
}
