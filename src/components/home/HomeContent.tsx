"use client";

import { useMemo, useState, useTransition } from "react";
import type { Conteudo, Universo } from "@/types/database";
import Navbar from "@/components/layout/Navbar";
import UpsellSection from "@/components/layout/UpsellSection";
import HeroBanner from "@/components/catalog/HeroBanner";
import UniversosBar from "@/components/catalog/UniversosBar";
import Carrossel from "@/components/catalog/Carrossel";
import CardFilme from "@/components/catalog/CardFilme";
import Top12 from "@/components/catalog/Top12";
import {
  UNIVERSOS_CONFIG,
  categoriaParaSlug,
  COR_UNIVERSO_PADRAO,
} from "@/lib/universos-config";

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

  const universos: Universo[] = useMemo(() => {
    return categorias.map((nm_categoria) => {
      const slug = categoriaParaSlug(nm_categoria);
      const config = UNIVERSOS_CONFIG[slug];
      const itensCategoria = porCategoria.get(nm_categoria) ?? [];
      return {
        nm_categoria,
        slug,
        label: config?.label ?? nm_categoria,
        cor: config?.cor ?? COR_UNIVERSO_PADRAO,
        ds_url_imagem: config?.imagemUrl ?? itensCategoria[0]?.ds_url_poster ?? undefined,
        nr_total_conteudos: itensCategoria.length,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conteudos, categorias]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar busca={busca} onBuscaChange={aoMudarBusca} />

      {buscando ? (
        <section className="px-4 pb-16 pt-24 sm:px-8">
          <h2 className="mb-4 text-lg font-bold text-foreground">
            {resultadosBusca.length > 0
              ? `${resultadosBusca.length} resultado(s)`
              : "Nenhum resultado encontrado"}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {resultadosBusca.map((conteudo, i) => (
              <div
                key={conteudo.cd_conteudo}
                className="animate-fade-in-up"
                style={{ animationDelay: `${Math.min(i, 20) * 50}ms` }}
              >
                <CardFilme conteudo={conteudo} variant="grid" />
              </div>
            ))}
          </div>
        </section>
      ) : (
        <>
          {destaques.length > 0 && <HeroBanner destaques={destaques} />}

          <UniversosBar universos={universos} />

          <UpsellSection />

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
        </>
      )}
    </div>
  );
}
