"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Conteudo } from "@/types/database";
import { formatarViews } from "@/lib/catalogo";
import PosterImg from "./PosterImg";

export default function HeroBanner({ destaques }: { destaques: Conteudo[] }) {
  const trilhoRef = useRef<HTMLElement>(null);
  const pausadoRef = useRef(false);

  useEffect(() => {
    if (destaques.length <= 1) return;

    const id = setInterval(() => {
      const trilho = trilhoRef.current;
      if (!trilho || pausadoRef.current) return;

      const largura = trilho.firstElementChild?.clientWidth ?? trilho.clientWidth;
      const gap = 16;
      const fim = trilho.scrollWidth - trilho.clientWidth;
      const proximo = trilho.scrollLeft + largura + gap;

      trilho.scrollTo({
        left: proximo > fim + 10 ? 0 : proximo,
        behavior: "smooth",
      });
    }, 3000);

    return () => clearInterval(id);
  }, [destaques.length]);

  if (destaques.length === 0) return null;

  function pausar() {
    pausadoRef.current = true;
  }

  function retomar() {
    setTimeout(() => {
      pausadoRef.current = false;
    }, 4000);
  }

  return (
    <section
      ref={trilhoRef}
      onPointerDown={pausar}
      onPointerUp={retomar}
      onMouseEnter={pausar}
      onMouseLeave={retomar}
      className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 py-2.5 [scrollbar-width:none] sm:px-8 [&::-webkit-scrollbar]:hidden"
    >
      {destaques.map((item, indice) => (
        <Link
          key={item.cd_conteudo}
          href={`/filme/${item.cd_conteudo}`}
          className="relative h-[450px] min-w-[88vw] shrink-0 snap-center overflow-hidden rounded-2xl bg-surface sm:min-w-[420px]"
        >
          {item.ds_url_poster ? (
            <PosterImg
              src={item.ds_url_poster}
              largura={700}
              alt={item.nm_titulo}
              loading={indice === 0 ? "eager" : "lazy"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-4 text-center text-lg font-bold text-secondary">
              {item.nm_titulo}
            </div>
          )}

          {typeof item.nr_views === "number" && item.nr_views > 0 && (
            <div className="absolute top-3 right-3 rounded-full bg-black/75 px-3 py-1 text-xs font-semibold text-emerald-400 backdrop-blur-md">
              👁️ {formatarViews(item.nr_views)}
            </div>
          )}

          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 flex h-[45%] items-end justify-center pb-4"
            style={{
              backgroundImage: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)",
            }}
          >
            <span className="rounded-full bg-primary px-3.5 py-1.5 text-[11px] font-bold text-white shadow-lg sm:px-4 sm:text-xs">
              🛒 Comprar
            </span>
          </div>
        </Link>
      ))}
    </section>
  );
}
