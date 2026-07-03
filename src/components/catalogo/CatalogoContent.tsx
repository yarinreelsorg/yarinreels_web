"use client";

import { useState, useTransition } from "react";
import type { Conteudo, TpFormato } from "@/types/database";
import Navbar from "@/components/layout/Navbar";
import CardFilme from "@/components/catalog/CardFilme";

const FORMATOS: { label: string; value: TpFormato | null }[] = [
  { label: "Todos", value: null },
  { label: "Filmes", value: "FILME" },
  { label: "Séries", value: "SERIE" },
  { label: "Documentários", value: "DOCUMENTARIO" },
  { label: "Aulas", value: "AULA" },
];

type Ordenacao = "relevancia" | "recentes" | "az";

const TAMANHO_PAGINA = 24;

export default function CatalogoContent({
  conteudos,
  categorias,
  formatoInicial,
  categoriaInicial,
  buscaInicial = "",
}: {
  conteudos: Conteudo[];
  categorias: string[];
  formatoInicial: TpFormato | null;
  categoriaInicial: string | null;
  buscaInicial?: string;
}) {
  const [busca, setBusca] = useState(buscaInicial);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(
    categoriaInicial
  );
  const [formatoAtivo, setFormatoAtivo] = useState<TpFormato | null>(
    formatoInicial
  );
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("relevancia");
  const [visiveis, setVisiveis] = useState(TAMANHO_PAGINA);
  const [, startTransition] = useTransition();

  function aoMudarBusca(valor: string) {
    startTransition(() => {
      setBusca(valor);
      setVisiveis(TAMANHO_PAGINA);
    });
  }

  function aoMudarCategoria(categoria: string | null) {
    startTransition(() => {
      setCategoriaAtiva(categoria);
      setVisiveis(TAMANHO_PAGINA);
    });
  }

  function aoMudarFormato(formato: TpFormato | null) {
    startTransition(() => {
      setFormatoAtivo(formato);
      setVisiveis(TAMANHO_PAGINA);
    });
  }

  const termo = busca.trim().toLowerCase();

  const filtrados = conteudos.filter((c) => {
    const bateBusca =
      termo.length === 0 || c.nm_titulo.toLowerCase().includes(termo);
    const bateCategoria =
      categoriaAtiva === null || c.nm_categoria === categoriaAtiva;
    const bateFormato = formatoAtivo === null || c.tp_formato === formatoAtivo;
    return bateBusca && bateCategoria && bateFormato;
  });

  const ordenados = [...filtrados].sort((a, b) => {
    if (ordenacao === "az") {
      return a.nm_titulo.localeCompare(b.nm_titulo, "pt-BR");
    }
    if (ordenacao === "recentes") {
      const dataA = a.dt_lancamento ? new Date(a.dt_lancamento).getTime() : 0;
      const dataB = b.dt_lancamento ? new Date(b.dt_lancamento).getTime() : 0;
      return dataB - dataA;
    }
    return b.nr_views - a.nr_views;
  });

  const resultados = ordenados.slice(0, visiveis);
  const temMais = ordenados.length > visiveis;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        categorias={categorias}
        categoriaAtiva={categoriaAtiva}
        busca={busca}
        onBuscaChange={aoMudarBusca}
        onCategoriaChange={aoMudarCategoria}
      />

      <section className="px-4 pb-16 pt-8 sm:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-foreground sm:text-3xl">
              Catálogo
            </h1>
            <p className="mt-1 text-sm text-secondary">
              {ordenados.length} título{ordenados.length === 1 ? "" : "s"}{" "}
              encontrado{ordenados.length === 1 ? "" : "s"}
            </p>
          </div>

          <select
            value={ordenacao}
            onChange={(e) => setOrdenacao(e.target.value as Ordenacao)}
            className="rounded-full border border-secondary/30 bg-black/30 px-4 py-1.5 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="relevancia" className="bg-background">
              Mais vistos
            </option>
            <option value="recentes" className="bg-background">
              Lançamentos
            </option>
            <option value="az" className="bg-background">
              A-Z
            </option>
          </select>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {FORMATOS.map((formato) => (
            <button
              key={formato.label}
              type="button"
              onClick={() => aoMudarFormato(formato.value)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                formatoAtivo === formato.value
                  ? "border-primary bg-[rgba(139,92,246,0.2)] text-foreground"
                  : "border-secondary/30 text-secondary hover:border-primary/60 hover:text-foreground"
              }`}
            >
              {formato.label}
            </button>
          ))}
        </div>

        {resultados.length === 0 ? (
          <p className="py-16 text-center text-secondary">
            Nenhum título encontrado com esses filtros.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {resultados.map((conteudo) => (
                <CardFilme
                  key={conteudo.cd_conteudo}
                  conteudo={conteudo}
                  variant="grid"
                />
              ))}
            </div>

            {temMais && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisiveis((v) => v + TAMANHO_PAGINA)}
                  className="rounded-full border border-primary/60 px-8 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-primary/15"
                >
                  Carregar mais
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
