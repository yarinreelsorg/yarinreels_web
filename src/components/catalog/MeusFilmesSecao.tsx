"use client";

import { useState } from "react";
import type { Conteudo } from "@/types/database";
import CardFilme from "@/components/catalog/CardFilme";
import { SecaoTitulo, EstadoVazio } from "@/components/catalog/SecaoTitulo";
import Pagination from "@/components/catalog/Pagination";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";

export type ItemMeusFilmes = {
  conteudo: Conteudo;
  grupo: "ativo" | "assinatura" | "expirado";
  badge?: string;
  legenda?: string;
  href?: string;
};

const TITULO_GRUPO: Record<ItemMeusFilmes["grupo"], string | null> = {
  ativo: null,
  assinatura: "Liberado pela sua assinatura",
  expirado: "Expirados",
};

const ITENS_POR_PAGINA = 18;

export default function MeusFilmesSecao({ itens }: { itens: ItemMeusFilmes[] }) {
  const [busca, setBusca] = useState("");
  const [paginas, setPaginas] = useState<Record<string, number>>({});

  const termo = busca.trim().toLowerCase();
  const filtrados = termo
    ? itens.filter((item) => item.conteudo.nm_titulo.toLowerCase().includes(termo))
    : itens;

  const aoBuscar = (valor: string) => {
    setBusca(valor);
    setPaginas({});
  };

  const grupos: ItemMeusFilmes["grupo"][] = ["ativo", "assinatura", "expirado"];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SecaoTitulo>Meus Filmes</SecaoTitulo>

        {itens.length > 0 && (
          <div className="relative w-full max-w-[240px]">
            <input
              type="text"
              value={busca}
              onChange={(e) => aoBuscar(e.target.value)}
              placeholder="Buscar nos meus filmes..."
              className="w-full rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-secondary/60 focus:border-accent/50"
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-secondary">
              🔍
            </span>
          </div>
        )}
      </div>

      {itens.length === 0 ? (
        <EstadoVazio texto="Você ainda não comprou nada." />
      ) : filtrados.length === 0 ? (
        <p className="mt-6 text-sm text-secondary">
          Nenhum título encontrado pra &quot;{busca}&quot;.
        </p>
      ) : (
        <div className="mt-5 space-y-10">
          {grupos.map((grupo) => {
            const itensDoGrupo = filtrados.filter((item) => item.grupo === grupo);
            if (itensDoGrupo.length === 0) return null;

            const totalPaginas = Math.max(1, Math.ceil(itensDoGrupo.length / ITENS_POR_PAGINA));
            const paginaAtual = Math.min(paginas[grupo] ?? 1, totalPaginas);
            const itensPaginados = itensDoGrupo.slice(
              (paginaAtual - 1) * ITENS_POR_PAGINA,
              paginaAtual * ITENS_POR_PAGINA
            );

            const titulo = TITULO_GRUPO[grupo];
            const opaco = grupo === "expirado";

            return (
              <div key={grupo}>
                {titulo && (
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-secondary">
                    {titulo}
                  </p>
                )}
                <StaggerGroup
                  key={paginaAtual}
                  className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                  staggerChildren={0.03}
                >
                  {itensPaginados.map((item) => (
                    <StaggerItem key={item.conteudo.cd_conteudo}>
                      <div className={opaco ? "opacity-45 grayscale transition-opacity hover:opacity-70" : undefined}>
                        <CardFilme
                          conteudo={item.conteudo}
                          variant="grid"
                          href={item.href}
                          badge={item.badge}
                          legenda={item.legenda}
                        />
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerGroup>

                <Pagination
                  paginaAtual={paginaAtual}
                  totalPaginas={totalPaginas}
                  layoutId={`minha-lista-pagina-${grupo}`}
                  onChange={(p) => setPaginas((atual) => ({ ...atual, [grupo]: p }))}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
