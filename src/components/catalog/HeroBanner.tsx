"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Conteudo } from "@/types/database";
import { formatarPreco, formatarViews } from "@/lib/catalogo";

const INTERVALO_MS = 6000;

export default function HeroBanner({ destaques }: { destaques: Conteudo[] }) {
  const [index, setIndex] = useState(0);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (destaques.length <= 1 || pausado) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % destaques.length);
    }, INTERVALO_MS);
    return () => clearInterval(id);
  }, [destaques.length, pausado]);

  if (destaques.length === 0) return null;

  const atual = destaques[index % destaques.length];
  const precoAluguel = formatarPreco(atual.vl_aluguel);

  return (
    <section
      className="relative flex h-screen w-full items-end overflow-hidden"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      <div className="absolute inset-0">
        {atual.ds_url_poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={atual.cd_conteudo}
            src={atual.ds_url_poster}
            alt={atual.nm_titulo}
            className="h-full w-full object-cover object-top transition-opacity duration-700"
          />
        ) : (
          <div className="h-full w-full bg-surface" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/70 to-transparent" />
      </div>

      <div className="relative z-10 max-w-2xl px-6 pb-20 sm:px-10 lg:px-20">
        <span className="mb-4 inline-block rounded-full bg-primary/90 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-white">
          {atual.nm_categoria || "Destaque"}
        </span>

        <h1 className="text-[40px] font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-[64px]">
          {atual.nm_titulo}
        </h1>

        {atual.ds_descricao && (
          <p className="mt-4 line-clamp-2 max-w-xl text-base leading-relaxed text-secondary">
            {atual.ds_descricao}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-secondary">
          {atual.nm_idioma && <span>{atual.nm_idioma}</span>}
          {atual.nm_idioma && <span>·</span>}
          <span>{atual.tp_formato}</span>
          <span>·</span>
          <span>{formatarViews(atual.nr_views)}</span>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link
            href={`/assistir/${atual.cd_conteudo}`}
            className="rounded-md bg-white px-8 py-3 text-sm font-bold text-black transition-colors hover:bg-white/90 sm:text-base"
          >
            ▶ Assistir
          </Link>
          <button
            type="button"
            className="rounded-md border border-white/30 bg-white/5 px-8 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/15 sm:text-base"
          >
            + Minha Lista
          </button>
        </div>

        {precoAluguel && (
          <p className="mt-4 text-sm font-semibold text-accent">
            Aluguel: {precoAluguel}
          </p>
        )}
      </div>

      {destaques.length > 1 && (
        <div className="absolute bottom-8 right-6 z-10 flex gap-2 sm:right-10">
          {destaques.map((item, i) => (
            <button
              key={item.cd_conteudo}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver destaque ${item.nm_titulo}`}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                i === index ? "bg-accent" : "bg-white/25 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
