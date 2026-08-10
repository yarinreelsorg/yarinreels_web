"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import type { Conteudo } from "@/types/database";
import { definirCarrosselDestaque, definirTop12 } from "./actions";
import { buttonTap } from "@/lib/motion";
import { useToast } from "@/components/admin/ToastProvider";

type ItemLista = { cd_conteudo: string; nm_titulo: string; ds_url_poster: string | null };

function ListaCurada({
  titulo,
  descricao,
  limite,
  todos,
  selecionadosIniciais,
  aoSalvar,
}: {
  titulo: string;
  descricao: string;
  limite: number;
  todos: ItemLista[];
  selecionadosIniciais: ItemLista[];
  aoSalvar: (idsEmOrdem: string[]) => Promise<void>;
}) {
  const toast = useToast();
  const [selecionados, setSelecionados] = useState<ItemLista[]>(selecionadosIniciais);
  const [buscaAdicionar, setBuscaAdicionar] = useState("");
  const [indiceArrastado, setIndiceArrastado] = useState<number | null>(null);
  const [indiceSobre, setIndiceSobre] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const idsSelecionados = useMemo(
    () => new Set(selecionados.map((c) => c.cd_conteudo)),
    [selecionados]
  );

  const opcoesParaAdicionar = useMemo(() => {
    const termo = buscaAdicionar.trim().toLowerCase();
    return todos
      .filter((c) => !idsSelecionados.has(c.cd_conteudo))
      .filter((c) => termo.length === 0 || c.nm_titulo.toLowerCase().includes(termo))
      .slice(0, 8);
  }, [todos, idsSelecionados, buscaAdicionar]);

  function mover(origem: number, destino: number) {
    if (destino < 0 || destino >= selecionados.length || origem === destino) return;
    const proxima = [...selecionados];
    const [removido] = proxima.splice(origem, 1);
    proxima.splice(destino, 0, removido);
    setSelecionados(proxima);
    setSalvo(false);
  }

  function remover(cdConteudo: string) {
    setSelecionados((atual) => atual.filter((c) => c.cd_conteudo !== cdConteudo));
    setSalvo(false);
  }

  function adicionar(item: ItemLista) {
    setSelecionados((atual) => [...atual, item]);
    setBuscaAdicionar("");
    setSalvo(false);
  }

  async function salvar() {
    setSalvando(true);
    try {
      await aoSalvar(selecionados.map((c) => c.cd_conteudo));
      setSalvo(true);
      toast.sucesso(`${titulo} salvo.`);
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function limpar() {
    setSalvando(true);
    try {
      await aoSalvar([]);
      setSelecionados([]);
      toast.sucesso(`${titulo} voltou ao ranking automático.`);
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : "Erro ao limpar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">{titulo}</h2>
          <p className="mt-1 max-w-xl text-sm text-[#A78BFA]">{descricao}</p>
        </div>
        <span className="shrink-0 rounded-full bg-[#050208] border border-[rgba(139,92,246,0.2)] px-3 py-1 text-xs font-bold text-[#A78BFA]">
          {selecionados.length}/{limite}
        </span>
      </div>

      {selecionados.length === 0 ? (
        <p className="mt-4 text-sm text-[#A78BFA]">
          Nada escolhido — usando ranking automático por visualizações.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-1.5">
          {selecionados.map((item, indice) => (
            <div
              key={item.cd_conteudo}
              draggable
              onDragStart={() => setIndiceArrastado(indice)}
              onDragOver={(e) => {
                e.preventDefault();
                if (indiceSobre !== indice) setIndiceSobre(indice);
              }}
              onDragEnd={() => {
                setIndiceArrastado(null);
                setIndiceSobre(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (indiceArrastado !== null) mover(indiceArrastado, indice);
                setIndiceArrastado(null);
                setIndiceSobre(null);
              }}
              className={`flex cursor-grab items-center gap-3 rounded-md border bg-[#050208] px-3 py-2 transition-colors active:cursor-grabbing ${
                indiceSobre === indice ? "border-[#9D4EDD]" : "border-[rgba(139,92,246,0.15)]"
              } ${indiceArrastado === indice ? "opacity-40" : ""} ${
                indice >= limite ? "opacity-50" : ""
              }`}
            >
              <span className="w-5 shrink-0 text-center text-xs font-bold text-[#A78BFA]">
                {indice + 1}
              </span>
              {item.ds_url_poster ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.ds_url_poster}
                  alt=""
                  className="h-10 w-7 shrink-0 rounded object-cover"
                />
              ) : (
                <span className="h-10 w-7 shrink-0 rounded bg-[#0D0A1A]" />
              )}
              <span className="flex-1 truncate text-sm font-semibold text-white">
                {item.nm_titulo}
              </span>
              {indice >= limite && (
                <span className="shrink-0 text-[10px] font-bold uppercase text-amber-400">
                  fora do limite
                </span>
              )}
              <button
                type="button"
                onClick={() => remover(item.cd_conteudo)}
                aria-label="Remover"
                className="shrink-0 text-lg text-[#A78BFA] hover:text-red-400"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative mt-4">
        <input
          type="text"
          value={buscaAdicionar}
          onChange={(e) => setBuscaAdicionar(e.target.value)}
          placeholder="Buscar título pra adicionar..."
          className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-sm text-white"
        />
        {buscaAdicionar.trim().length > 0 && opcoesParaAdicionar.length > 0 && (
          <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-[rgba(139,92,246,0.3)] bg-[#0D0A1A] shadow-xl">
            {opcoesParaAdicionar.map((item) => (
              <button
                key={item.cd_conteudo}
                type="button"
                onClick={() => adicionar(item)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white hover:bg-white/5"
              >
                {item.nm_titulo}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <motion.button
          type="button"
          onClick={salvar}
          disabled={salvando}
          {...buttonTap}
          className="rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] disabled:opacity-50 px-5 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer"
        >
          {salvando ? "Salvando..." : salvo ? "Salvo!" : "Salvar ordem"}
        </motion.button>
        {selecionados.length > 0 && (
          <button
            type="button"
            onClick={limpar}
            disabled={salvando}
            className="text-xs font-bold text-[#A78BFA] hover:text-white disabled:opacity-50"
          >
            Voltar pro automático
          </button>
        )}
      </div>
    </div>
  );
}

export default function DestaquesAdminClient({ conteudos }: { conteudos: Conteudo[] }) {
  const todos: ItemLista[] = conteudos.map((c) => ({
    cd_conteudo: c.cd_conteudo,
    nm_titulo: c.nm_titulo,
    ds_url_poster: c.ds_url_poster,
  }));

  const carrosselInicial = conteudos
    .filter((c) => c.sn_destaque)
    .sort((a, b) => (a.nr_ordem_destaque ?? 0) - (b.nr_ordem_destaque ?? 0))
    .map((c) => ({ cd_conteudo: c.cd_conteudo, nm_titulo: c.nm_titulo, ds_url_poster: c.ds_url_poster }));

  const top12Inicial = conteudos
    .filter((c) => c.sn_top12)
    .sort((a, b) => (a.nr_ordem_top12 ?? 0) - (b.nr_ordem_top12 ?? 0))
    .map((c) => ({ cd_conteudo: c.cd_conteudo, nm_titulo: c.nm_titulo, ds_url_poster: c.ds_url_poster }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Destaques da Home</h1>
        <p className="text-sm text-[#A78BFA]">
          Escolha exatamente o que aparece no Carrossel de Destaque e no Top 12 — sem nada
          escolhido aqui, as duas seções continuam automáticas (mais vistos).
        </p>
      </div>

      <ListaCurada
        titulo="Carrossel de Destaque (Hero)"
        descricao="Banner rotativo no topo da home. Só os 5 primeiros aparecem."
        limite={5}
        todos={todos}
        selecionadosIniciais={carrosselInicial}
        aoSalvar={definirCarrosselDestaque}
      />

      <ListaCurada
        titulo="Top 12"
        descricao="Fileira de mais populares logo abaixo do banner. Só os 12 primeiros aparecem."
        limite={12}
        todos={todos}
        selecionadosIniciais={top12Inicial}
        aoSalvar={definirTop12}
      />
    </div>
  );
}
