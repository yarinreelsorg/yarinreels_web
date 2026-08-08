"use client";

import Link from "next/link";
import { useState } from "react";
import { removerDoHistorico } from "@/lib/historico-actions";
import type { ItemContinuarAssistindo } from "@/lib/historico";

export default function ContinuarAssistindo({
  itens,
}: {
  itens: ItemContinuarAssistindo[];
}) {
  const [lista, setLista] = useState(itens);

  if (lista.length === 0) return null;

  async function remover(cdConteudo: string) {
    setLista((atual) => atual.filter((item) => item.conteudo.cd_conteudo !== cdConteudo));
    await removerDoHistorico(cdConteudo);
  }

  return (
    <section className="py-5">
      <h2 className="mb-3 px-4 text-[17px] font-black text-foreground sm:px-8">
        Continuar assistindo
      </h2>

      <div className="flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:px-8 lg:gap-4 [&::-webkit-scrollbar]:hidden">
        {lista.map((item) => (
          <div key={item.conteudo.cd_conteudo} className="group relative shrink-0 w-[125px] lg:w-[230px]">
            <Link
              href={`/assistir/${item.conteudo.cd_conteudo}`}
              className="relative block overflow-hidden rounded-lg bg-surface"
            >
              <div className="h-[185px] w-[125px] lg:h-[340px] lg:w-[230px]">
                {item.conteudo.ds_url_poster ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.conteudo.ds_url_poster}
                    alt={item.conteudo.nm_titulo}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-secondary">
                    {item.conteudo.nm_titulo}
                  </div>
                )}
              </div>

              <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-lg text-black">
                  ▶
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 h-1 bg-black/60">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${Math.max(4, item.progresso)}%` }}
                />
              </div>
            </Link>

            <button
              type="button"
              onClick={() => remover(item.conteudo.cd_conteudo)}
              aria-label={`Remover ${item.conteudo.nm_titulo} do histórico`}
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs text-white opacity-0 transition-opacity hover:bg-black/90 group-hover:opacity-100 sm:opacity-100"
            >
              ✕
            </button>

            <Link
              href={`/assistir/${item.conteudo.cd_conteudo}`}
              className="mt-2 h-[34px] overflow-hidden line-clamp-2 text-xs font-bold leading-tight text-foreground lg:h-[45px] lg:text-base"
            >
              {item.conteudo.nm_titulo}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
