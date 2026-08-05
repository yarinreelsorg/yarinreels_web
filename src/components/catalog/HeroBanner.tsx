"use client";

import Link from "next/link";
import type { Conteudo } from "@/types/database";

export default function HeroBanner({ destaques }: { destaques: Conteudo[] }) {
  if (destaques.length === 0) return null;

  return (
    <section className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 py-2.5 [scrollbar-width:none] sm:px-8 [&::-webkit-scrollbar]:hidden">
      {destaques.map((item) => (
        <Link
          key={item.cd_conteudo}
          href={`/filme/${item.cd_conteudo}`}
          className="relative h-[450px] min-w-[88vw] shrink-0 snap-center overflow-hidden rounded-2xl bg-surface sm:min-w-[420px]"
        >
          {item.ds_url_poster ? (
            <img
              src={item.ds_url_poster}
              alt={item.nm_titulo}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-4 text-center text-lg font-bold text-secondary">
              {item.nm_titulo}
            </div>
          )}

          <div
            className="absolute inset-x-0 bottom-0 flex h-[60%] items-end justify-center pb-6"
            style={{
              backgroundImage: "linear-gradient(to top, rgba(0,0,0,1), transparent)",
            }}
          >
            <span className="w-[85%] max-w-[250px] rounded-md bg-primary py-3.5 text-center font-black text-white shadow-lg">
              🛒 Comprar
            </span>
          </div>
        </Link>
      ))}
    </section>
  );
}
