"use client";

import { useState, useTransition } from "react";
import type { Conteudo } from "@/types/database";
import Navbar from "@/components/layout/Navbar";
import UpsellSection from "@/components/layout/UpsellSection";
import HeroBanner from "@/components/catalog/HeroBanner";
import ChipsCategorias from "@/components/catalog/ChipsCategorias";
import AppsBar from "@/components/catalog/AppsBar";
import Carrossel from "@/components/catalog/Carrossel";
import CardFilme from "@/components/catalog/CardFilme";
import Top12 from "@/components/catalog/Top12";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";

export default function HomeContent({
  conteudos,
  categorias,
  apps,
  destaques,
  top12,
  cdPlanoPromo,
}: {
  conteudos: Conteudo[];
  categorias: string[];
  apps: string[];
  destaques: Conteudo[];
  top12: Conteudo[];
  cdPlanoPromo: string | null;
}) {
  const [busca, setBusca] = useState("");
  const [, startTransition] = useTransition();

  function aoMudarBusca(valor: string) {
    startTransition(() => setBusca(valor));
  }

  const buscando = busca.trim().length > 0;

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

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar busca={busca} onBuscaChange={aoMudarBusca} />

      <AppsBar apps={apps} />

      {buscando ? (
        <section className="px-4 pb-16 pt-6 sm:px-8">
          <h2 className="mb-4 text-lg font-bold text-foreground">
            {resultadosBusca.length > 0
              ? `${resultadosBusca.length} resultado(s)`
              : "Nenhum resultado encontrado"}
          </h2>
          <StaggerGroup
            key={termo}
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            staggerChildren={0.04}
          >
            {resultadosBusca.map((conteudo) => (
              <StaggerItem key={conteudo.cd_conteudo}>
                <CardFilme conteudo={conteudo} variant="grid" />
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>
      ) : (
        <div className="mx-auto w-full max-w-[1600px]">
          <ChipsCategorias categorias={categorias} />

          {destaques.length > 0 && <HeroBanner destaques={destaques} />}

          <UpsellSection destaques={destaques} cdPlanoPromo={cdPlanoPromo} />

          {top12.length > 0 && <Top12 itens={top12} />}

          <div className="flex flex-col">
            {categorias.map((categoria) => (
              <Carrossel
                key={categoria}
                titulo={categoria}
                itens={porCategoria.get(categoria) ?? []}
                verTudoHref={`/catalogo?categoria=${encodeURIComponent(categoria)}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
