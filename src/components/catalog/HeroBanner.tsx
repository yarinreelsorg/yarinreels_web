"use client";

import Link from "next/link";
import { useState } from "react";
import type { Conteudo } from "@/types/database";
import { formatarPreco, calcularRating } from "@/lib/catalogo";
import Estrelas from "./Estrelas";

export default function HeroBanner({ destaques }: { destaques: Conteudo[] }) {
  const [index, setIndex] = useState(0);

  if (destaques.length === 0) return null;

  const atual = destaques[index % destaques.length];
  const generos = atual.ds_generos
    ?.split(",")
    .map((g) => g.trim())
    .filter(Boolean);
  const precoAluguel = formatarPreco(atual.vl_aluguel);
  const precoVitalicio = formatarPreco(atual.vl_vitalicio);
  const rating = calcularRating(atual.nr_views);

  function proximo() {
    setIndex((i) => (i + 1) % destaques.length);
  }

  function anterior() {
    setIndex((i) => (i - 1 + destaques.length) % destaques.length);
  }

  return (
    <section className="relative flex h-[85vh] min-h-[560px] w-full items-end overflow-hidden">
      <div className="absolute inset-0">
        {atual.ds_url_poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={atual.cd_conteudo}
            src={atual.ds_url_poster}
            alt={atual.nm_titulo}
            className="h-full w-full scale-105 object-cover object-top blur-[2px]"
          />
        ) : (
          <div className="h-full w-full bg-primary-dark/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />
      </div>

      <div className="relative z-10 max-w-2xl px-4 pb-20 sm:px-8 lg:pb-24">
        <span className="mb-4 inline-block rounded border border-[rgba(139,92,246,0.5)] bg-[rgba(139,92,246,0.2)] px-3 py-1 text-xs font-bold uppercase tracking-wide text-foreground">
          {atual.nm_categoria || "Destaque"}
        </span>

        <h1 className="text-[38px] font-black leading-[1.05] text-foreground sm:text-[52px]">
          {atual.nm_titulo}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-secondary">
          <Estrelas rating={rating} />
          <span>{rating.toFixed(1)}</span>
          {atual.nm_idioma && (
            <>
              <span className="text-primary">•</span>
              <span>{atual.nm_idioma}</span>
            </>
          )}
          <span className="text-primary">•</span>
          <span>{atual.tp_formato}</span>
          {generos && generos.length > 0 && (
            <>
              <span className="text-primary">•</span>
              <span className="line-clamp-1">{generos.join(", ")}</span>
            </>
          )}
        </div>

        {atual.ds_descricao && (
          <p className="mt-4 line-clamp-3 max-w-xl text-sm text-secondary sm:text-base">
            {atual.ds_descricao}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href={`/assistir/${atual.cd_conteudo}`}
            className="rounded-lg bg-primary px-7 py-3.5 text-sm font-bold text-white shadow-[0_8px_30px_rgba(139,92,246,0.4)] transition-colors hover:bg-primary-dark sm:text-base"
          >
            ▶ Assistir
          </Link>
          <button
            type="button"
            className="rounded-lg border border-secondary/40 px-7 py-3.5 text-sm font-bold text-foreground backdrop-blur-sm transition-colors hover:border-primary hover:text-primary sm:text-base"
          >
            + Minha Lista
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-5 text-sm text-secondary">
          {precoAluguel && (
            <span>
              Aluguel: <strong className="text-primary">{precoAluguel}</strong>
            </span>
          )}
          {precoVitalicio && (
            <span>
              Vitalício:{" "}
              <strong className="text-primary">{precoVitalicio}</strong>
            </span>
          )}
        </div>
      </div>

      {destaques.length > 1 && (
        <div className="relative z-10 ml-auto mr-4 hidden flex-col items-end gap-3 pb-20 lg:flex xl:mr-10">
          <div className="flex flex-col gap-3">
            {destaques.map((item, i) => (
              <button
                key={item.cd_conteudo}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ver destaque ${item.nm_titulo}`}
                className={`relative h-20 w-36 shrink-0 overflow-hidden rounded-lg transition-all duration-300 ${
                  i === index
                    ? "scale-105 opacity-100 ring-2 ring-primary shadow-[0_0_20px_rgba(139,92,246,0.5)]"
                    : "opacity-50 hover:opacity-90"
                }`}
              >
                {item.ds_url_poster ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.ds_url_poster}
                    alt={item.nm_titulo}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary-dark/40 text-[10px] text-secondary">
                    {item.nm_titulo}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20" />
                <span className="absolute bottom-1 left-1.5 right-1.5 line-clamp-1 text-[11px] font-semibold text-white">
                  {item.nm_titulo}
                </span>
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Destaque anterior"
              onClick={anterior}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-secondary/30 text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Próximo destaque"
              onClick={proximo}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-secondary/30 text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
