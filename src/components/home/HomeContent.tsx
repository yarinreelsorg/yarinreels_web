"use client";

import { useState, useTransition } from "react";
import type { Conteudo } from "@/types/database";
import Navbar from "@/components/layout/Navbar";
import UpsellSection from "@/components/layout/UpsellSection";
import HeroBanner from "@/components/catalog/HeroBanner";
import Carrossel from "@/components/catalog/Carrossel";
import CardFilme from "@/components/catalog/CardFilme";
import Top12 from "@/components/catalog/Top12";

export default function HomeContent({
  conteudos,
  categorias,
  destaques,
  top12,
}: {
  conteudos: Conteudo[];
  categorias: string[];
  destaques: Conteudo[];
  top12: Conteudo[];
}) {
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function aoMudarBusca(valor: string) {
    startTransition(() => setBusca(valor));
  }

  function aoMudarCategoria(categoria: string | null) {
    startTransition(() => setCategoriaAtiva(categoria));
  }

  const buscando = busca.trim().length > 0;
  const filtrandoCategoria = categoriaAtiva !== null;

  const termo = busca.trim().toLowerCase();
  const resultadosBusca = buscando
    ? conteudos.filter((c) => c.nm_titulo.toLowerCase().includes(termo))
    : [];

  const porCategoria = new Map<string, Conteudo[]>();
  for (const conteudo of conteudos) {
    const lista = porCategoria.get(conteudo.nm_categoria) ?? [];
    lista.push(conteudo);
    porCategoria.set(conteudo.nm_categoria, lista);
  }

  const categoriasVisiveis = filtrandoCategoria
    ? categorias.filter((c) => c === categoriaAtiva)
    : categorias;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        categorias={categorias}
        categoriaAtiva={categoriaAtiva}
        busca={busca}
        onBuscaChange={aoMudarBusca}
        onCategoriaChange={aoMudarCategoria}
      />

      {buscando ? (
        <section className="px-4 py-8 sm:px-8">
          <h2 className="mb-4 text-lg font-bold text-foreground">
            {resultadosBusca.length > 0
              ? `${resultadosBusca.length} resultado(s)`
              : "Nenhum resultado encontrado"}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {resultadosBusca.map((conteudo) => (
              <CardFilme
                key={conteudo.cd_conteudo}
                conteudo={conteudo}
                variant="grid"
              />
            ))}
          </div>
        </section>
      ) : (
        <>
          {destaques.length > 0 && <HeroBanner destaques={destaques} />}
          <UpsellSection />
          {!filtrandoCategoria && top12.length > 0 && <Top12 itens={top12} />}
          <div className="flex flex-col">
            {categorias.map((categoria) => (
              <div
                key={categoria}
                className={`transition-opacity duration-300 ${
                  categoriasVisiveis.includes(categoria)
                    ? "opacity-100"
                    : "pointer-events-none h-0 overflow-hidden opacity-0"
                }`}
              >
                <Carrossel
                  titulo={categoria}
                  itens={porCategoria.get(categoria) ?? []}
                  verTudoHref={`/catalogo?categoria=${encodeURIComponent(categoria)}`}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
