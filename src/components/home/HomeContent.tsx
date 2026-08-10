"use client";

import { useState, useTransition } from "react";
import type { Conteudo } from "@/types/database";
import type { ItemContinuarAssistindo } from "@/lib/historico";
import type { AppNavegacao } from "@/lib/apps-config";
import Navbar from "@/components/layout/Navbar";
import UpsellSection from "@/components/layout/UpsellSection";
import HeroBanner from "@/components/catalog/HeroBanner";
import ChipsCategorias from "@/components/catalog/ChipsCategorias";
import AppsBar from "@/components/catalog/AppsBar";
import Carrossel from "@/components/catalog/Carrossel";
import CardFilme from "@/components/catalog/CardFilme";
import Top12 from "@/components/catalog/Top12";
import ContinuarAssistindo from "@/components/catalog/ContinuarAssistindo";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";

export default function HomeContent({
  conteudos,
  categorias,
  apps,
  destaques,
  top12,
  cdPlanoPromo,
  continuarAssistindo,
  exibirPromoInicial,
}: {
  conteudos: Conteudo[];
  categorias: string[];
  apps: AppNavegacao[];
  destaques: Conteudo[];
  top12: Conteudo[];
  cdPlanoPromo: string | null;
  continuarAssistindo: ItemContinuarAssistindo[];
  exibirPromoInicial: boolean;
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

  // Lançamentos primeiro em cada fileira — assim que uma série nova entra
  // numa categoria, ela assume o topo e empurra as demais pra baixo.
  const porCategoria = new Map<string, Conteudo[]>();
  for (const conteudo of conteudos) {
    const lista = porCategoria.get(conteudo.nm_categoria) ?? [];
    lista.push(conteudo);
    porCategoria.set(conteudo.nm_categoria, lista);
  }
  for (const lista of porCategoria.values()) {
    lista.sort((a, b) => {
      const dataA = a.dt_lancamento ? new Date(a.dt_lancamento).getTime() : 0;
      const dataB = b.dt_lancamento ? new Date(b.dt_lancamento).getTime() : 0;
      return dataB - dataA;
    });
  }

  // Fileira "Lançamentos": mais recentes de todo o catálogo, sempre a
  // primeira fileira de categoria — dá destaque a conteúdo novo antes das
  // categorias fixas (Americanas, Brasileiras etc).
  const lancamentos = [...conteudos]
    .filter((c) => c.dt_lancamento)
    .sort((a, b) => new Date(b.dt_lancamento!).getTime() - new Date(a.dt_lancamento!).getTime())
    .slice(0, 20);

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

          {exibirPromoInicial && (
            <UpsellSection destaques={destaques} cdPlanoPromo={cdPlanoPromo} />
          )}

          {top12.length > 0 && <Top12 itens={top12} />}

          <ContinuarAssistindo itens={continuarAssistindo} />

          <div className="flex flex-col">
            {lancamentos.length > 0 && (
              <Carrossel titulo="Lançamentos" itens={lancamentos} />
            )}
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
