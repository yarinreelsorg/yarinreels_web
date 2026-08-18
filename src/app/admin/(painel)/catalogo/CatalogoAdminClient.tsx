"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import type { Conteudo, TpFormato } from "@/types/database";
import {
  adicionarConteudo,
  editarConteudo,
  exportarCatalogoCsv,
  removerConteudo,
  removerConteudosEmLote,
  toggleDestaque,
  toggleDestaqueEmLote,
} from "./actions";
import { otimizarUrlPoster } from "@/lib/catalogo";
import Pagination from "@/components/admin/Pagination";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import EpisodiosDrawer from "./EpisodiosDrawer";
import { useFocoModal } from "@/components/admin/useFocoModal";
import { useToast } from "@/components/admin/ToastProvider";
import { baixarCsv } from "@/lib/csv";
import { buttonTap } from "@/lib/motion";
import { formatarDataHora } from "@/lib/data";

interface Filtros {
  busca: string;
  categoria: string;
  formato: TpFormato | "";
  ordenarPor: "nm_titulo" | "nr_views" | "vl_aluguel" | "dt_lancamento";
  direcao: "asc" | "desc";
  pagina: number;
}

export default function CatalogoAdminClient({
  conteudos,
  vendasMensais,
  categoriasDisponiveis,
  totalRegistros,
  itensPorPagina,
  filtrosAtuais,
}: {
  conteudos: Conteudo[];
  vendasMensais: Record<string, number>;
  categoriasDisponiveis: string[];
  totalRegistros: number;
  itensPorPagina: number;
  filtrosAtuais: Filtros;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  const [buscaLocal, setBuscaLocal] = useState(filtrosAtuais.busca);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [conteudoEdicao, setConteudoEdicao] = useState<Conteudo | null>(null);
  const [cdEdicao, setCdEdicao] = useState<string>("");

  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  const [novaCategoria, setNovaCategoria] = useState("");
  const [urlPoster, setUrlPoster] = useState("");
  const [appOrigemValor, setAppOrigemValor] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<
    { tipo: "unico"; id: string; titulo: string } | { tipo: "lote" } | null
  >(null);
  const [excluindo, setExcluindo] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [conteudoEpisodios, setConteudoEpisodios] = useState<Conteudo | null>(null);

  const fecharModal = () => {
    setModalAberto(false);
    setConteudoEdicao(null);
    setUrlPoster("");
    setAppOrigemValor("");
  };

  const modalRef = useFocoModal<HTMLDivElement>(modalAberto, fecharModal);

  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / itensPorPagina));

  function atualizarUrl(mudancas: Partial<Filtros>) {
    const proximo: Filtros = { ...filtrosAtuais, ...mudancas };
    const params = new URLSearchParams();
    if (proximo.busca) params.set("busca", proximo.busca);
    if (proximo.categoria) params.set("categoria", proximo.categoria);
    if (proximo.formato) params.set("formato", proximo.formato);
    if (proximo.ordenarPor !== "dt_lancamento") params.set("sort", proximo.ordenarPor);
    if (proximo.direcao !== "desc") params.set("dir", proximo.direcao);
    if (proximo.pagina > 1) params.set("page", String(proximo.pagina));
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  const aoBuscar = (valor: string) => {
    setBuscaLocal(valor);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      atualizarUrl({ busca: valor, pagina: 1 });
    }, 400);
  };

  const aoOrdenar = (campo: Filtros["ordenarPor"]) => {
    if (filtrosAtuais.ordenarPor === campo) {
      atualizarUrl({ direcao: filtrosAtuais.direcao === "asc" ? "desc" : "asc" });
    } else {
      atualizarUrl({ ordenarPor: campo, direcao: "asc" });
    }
  };

  const indicadorOrdenacao = (campo: Filtros["ordenarPor"]) =>
    filtrosAtuais.ordenarPor === campo ? (filtrosAtuais.direcao === "asc" ? " ↑" : " ↓") : "";

  const abrirAdicionar = () => {
    setModoEdicao(false);
    setConteudoEdicao(null);
    setCdEdicao(crypto.randomUUID());
    setCategoriaSelecionada(categoriasDisponiveis[0] || "CRIAR_NOVA");
    setNovaCategoria("");
    setUrlPoster("");
    setAppOrigemValor("");
    setModalAberto(true);
  };

  const abrirEditar = (conteudo: Conteudo) => {
    setModoEdicao(true);
    setConteudoEdicao(conteudo);
    setCdEdicao(conteudo.cd_conteudo);
    setCategoriaSelecionada(conteudo.nm_categoria);
    setNovaCategoria("");
    setUrlPoster(conteudo.ds_url_poster || "");
    setAppOrigemValor(conteudo.nm_app_origem || "");
    setModalAberto(true);
  };

  const aoRemover = (id: string, titulo: string) => {
    setConfirmandoExclusao({ tipo: "unico", id, titulo });
  };

  const confirmarExclusao = async () => {
    if (!confirmandoExclusao) return;
    setExcluindo(true);
    try {
      if (confirmandoExclusao.tipo === "unico") {
        await removerConteudo(confirmandoExclusao.id);
        toast.sucesso("Conteúdo removido.");
      } else {
        await removerConteudosEmLote(Array.from(selecionados));
        toast.sucesso(`${selecionados.size} conteúdo(s) removido(s).`);
        setSelecionados(new Set());
      }
      setConfirmandoExclusao(null);
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : "Erro ao remover.");
    } finally {
      setExcluindo(false);
    }
  };

  const aoToggleDestaque = async (id: string, valor: boolean) => {
    try {
      await toggleDestaque(id, valor);
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : "Erro ao atualizar destaque.");
    }
  };

  const aoToggleDestaqueLote = async (valor: boolean) => {
    try {
      await toggleDestaqueEmLote(Array.from(selecionados), valor);
      toast.sucesso(`${selecionados.size} conteúdo(s) atualizado(s).`);
      setSelecionados(new Set());
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : "Erro ao atualizar em lote.");
    }
  };

  const aoSubmeter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSalvando(true);
    try {
      const formData = new FormData(e.currentTarget);
      const cat = categoriaSelecionada === "CRIAR_NOVA" ? novaCategoria : categoriaSelecionada;
      formData.set("nm_categoria", cat);
      formData.set("ds_url_poster", urlPoster);

      if (modoEdicao && conteudoEdicao) {
        await editarConteudo(conteudoEdicao.cd_conteudo, formData);
        toast.sucesso("Conteúdo atualizado.");
      } else {
        await adicionarConteudo(cdEdicao, formData);
        toast.sucesso("Conteúdo adicionado.");
      }
      fecharModal();
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  };

  const aoExportar = async () => {
    setExportando(true);
    try {
      const csv = await exportarCatalogoCsv({
        busca: filtrosAtuais.busca || undefined,
        categoria: filtrosAtuais.categoria || undefined,
        formato: (filtrosAtuais.formato as TpFormato) || undefined,
        ordenarPor: filtrosAtuais.ordenarPor,
        direcao: filtrosAtuais.direcao,
      });
      baixarCsv(csv, "catalogo.csv");
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : "Erro ao exportar CSV.");
    } finally {
      setExportando(false);
    }
  };

  const todosSelecionadosNaPagina =
    conteudos.length > 0 && conteudos.every((c) => selecionados.has(c.cd_conteudo));

  const alternarSelecaoTodos = () => {
    setSelecionados((atual) => {
      const proximo = new Set(atual);
      if (todosSelecionadosNaPagina) {
        for (const c of conteudos) proximo.delete(c.cd_conteudo);
      } else {
        for (const c of conteudos) proximo.add(c.cd_conteudo);
      }
      return proximo;
    });
  };

  const alternarSelecao = (id: string) => {
    setSelecionados((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Catálogo</h1>
          <p className="text-sm text-[#A78BFA]">Gerenciamento de filmes, séries e aulas.</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            type="button"
            onClick={aoExportar}
            disabled={exportando}
            {...buttonTap}
            className="rounded-md border border-[rgba(139,92,246,0.3)] px-4 py-2.5 text-sm font-bold text-[#A78BFA] transition-colors hover:bg-white/5 disabled:opacity-50 cursor-pointer"
          >
            {exportando ? "Exportando..." : "⇩ CSV"}
          </motion.button>
          <motion.button
            type="button"
            onClick={abrirAdicionar}
            {...buttonTap}
            className="rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] px-5 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer flex items-center justify-center"
          >
            ＋ Adicionar Conteúdo
          </motion.button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Buscar no catálogo..."
          value={buscaLocal}
          onChange={(e) => aoBuscar(e.target.value)}
          className="w-full max-w-md bg-[#0D0A1A] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] py-2 px-4 text-white text-sm"
        />
        <select
          value={filtrosAtuais.categoria}
          onChange={(e) => atualizarUrl({ categoria: e.target.value, pagina: 1 })}
          className="rounded-[6px] border border-[rgba(139,92,246,0.3)] bg-[#0D0A1A] px-3 py-2 text-sm text-white focus:border-[#9D4EDD] focus:outline-none"
        >
          <option value="">Todas as categorias</option>
          {categoriasDisponiveis.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <select
          value={filtrosAtuais.formato}
          onChange={(e) => atualizarUrl({ formato: e.target.value as TpFormato, pagina: 1 })}
          className="rounded-[6px] border border-[rgba(139,92,246,0.3)] bg-[#0D0A1A] px-3 py-2 text-sm text-white focus:border-[#9D4EDD] focus:outline-none"
        >
          <option value="">Todos os formatos</option>
          <option value="FILME">FILME</option>
          <option value="SERIE">SERIE</option>
          <option value="DOCUMENTARIO">DOCUMENTARIO</option>
          <option value="AULA">AULA</option>
        </select>
      </div>

      {/* Barra de seleção em lote */}
      <AnimatePresence>
        {selecionados.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-[#7B2FBE]/40 bg-[#7B2FBE]/10 px-4 py-3"
          >
            <span className="text-sm font-semibold text-white">
              {selecionados.size} selecionado(s)
            </span>
            <button
              type="button"
              onClick={() => aoToggleDestaqueLote(true)}
              className="rounded-md border border-[rgba(139,92,246,0.3)] px-3 py-1.5 text-xs font-bold text-[#A78BFA] hover:bg-white/5 cursor-pointer"
            >
              ⭐ Destacar
            </button>
            <button
              type="button"
              onClick={() => aoToggleDestaqueLote(false)}
              className="rounded-md border border-[rgba(139,92,246,0.3)] px-3 py-1.5 text-xs font-bold text-[#A78BFA] hover:bg-white/5 cursor-pointer"
            >
              ☆ Remover destaque
            </button>
            <button
              type="button"
              onClick={() => setConfirmandoExclusao({ tipo: "lote" })}
              className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20 cursor-pointer"
            >
              🗑️ Excluir selecionados
            </button>
            <button
              type="button"
              onClick={() => setSelecionados(new Set())}
              className="ml-auto text-xs text-[#A78BFA] hover:text-white cursor-pointer"
            >
              Cancelar seleção
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Catalog Table */}
      <div className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[rgba(139,92,246,0.15)] bg-[#050208]/50 text-xs font-semibold text-[#A78BFA] uppercase tracking-wider">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={todosSelecionadosNaPagina}
                    onChange={alternarSelecaoTodos}
                    aria-label="Selecionar todos nesta página"
                    className="h-4 w-4 rounded border-[rgba(139,92,246,0.3)] bg-[#050208] text-[#7B2FBE] cursor-pointer"
                  />
                </th>
                <th className="px-6 py-3 w-20">Poster</th>
                <th className="px-6 py-3">
                  <button type="button" onClick={() => aoOrdenar("nm_titulo")} className="cursor-pointer hover:text-white">
                    Título{indicadorOrdenacao("nm_titulo")}
                  </button>
                </th>
                <th className="px-6 py-3">Categoria</th>
                <th className="px-6 py-3">Formato</th>
                <th className="px-6 py-3">
                  <button type="button" onClick={() => aoOrdenar("vl_aluguel")} className="cursor-pointer hover:text-white">
                    Aluguel{indicadorOrdenacao("vl_aluguel")}
                  </button>
                </th>
                <th className="px-6 py-3">
                  <button type="button" onClick={() => aoOrdenar("dt_lancamento")} className="cursor-pointer hover:text-white">
                    Lançamento{indicadorOrdenacao("dt_lancamento")}
                  </button>
                </th>
                <th className="px-6 py-3">Destaque</th>
                <th className="px-6 py-3">Vendas (mês)</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <motion.tbody
              key={filtrosAtuais.pagina}
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.03 } } }}
              className="divide-y divide-[rgba(139,92,246,0.15)] text-sm text-white"
            >
              {conteudos.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-[#A78BFA]/70">
                    Nenhum conteúdo encontrado.
                  </td>
                </tr>
              ) : (
                conteudos.map((conteudo) => (
                  <motion.tr
                    key={conteudo.cd_conteudo}
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      show: { opacity: 1, y: 0 },
                    }}
                    className="hover:bg-[rgba(139,92,246,0.05)] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selecionados.has(conteudo.cd_conteudo)}
                        onChange={() => alternarSelecao(conteudo.cd_conteudo)}
                        aria-label={`Selecionar ${conteudo.nm_titulo}`}
                        className="h-4 w-4 rounded border-[rgba(139,92,246,0.3)] bg-[#050208] text-[#7B2FBE] cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-3">
                      {conteudo.ds_url_poster ? (
                        <img
                          src={otimizarUrlPoster(conteudo.ds_url_poster, 80) ?? undefined}
                          alt={conteudo.nm_titulo}
                          loading="lazy"
                          className="h-[60px] w-[40px] rounded object-cover border border-[rgba(139,92,246,0.15)]"
                        />
                      ) : (
                        <div className="h-[60px] w-[40px] rounded bg-[#050208] flex items-center justify-center text-[10px] text-center text-[#A78BFA]/50 border border-[rgba(139,92,246,0.15)]">
                          Sem img
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold">{conteudo.nm_titulo}</td>
                    <td className="px-6 py-4">{conteudo.nm_categoria}</td>
                    <td className="px-6 py-4 text-xs font-medium">
                      <span className="bg-[#050208] border border-[rgba(139,92,246,0.2)] px-2 py-0.5 rounded text-[#A78BFA]">
                        {conteudo.tp_formato}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {conteudo.vl_aluguel ? `R$ ${conteudo.vl_aluguel.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-6 py-4 text-xs text-[#A78BFA]/80">
                      {conteudo.dt_lancamento
                        ? formatarDataHora(conteudo.dt_lancamento)
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={conteudo.sn_destaque}
                        onChange={(e) => aoToggleDestaque(conteudo.cd_conteudo, e.target.checked)}
                        aria-label={`Destacar ${conteudo.nm_titulo}`}
                        className="h-4 w-4 rounded border-[rgba(139,92,246,0.3)] bg-[#050208] text-[#7B2FBE] focus:ring-[#9D4EDD] focus:ring-offset-[#0D0A1A] cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {vendasMensais[String(conteudo.cd_conteudo)] ?? 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {conteudo.tp_formato === "SERIE" && (
                          <button
                            type="button"
                            onClick={() => setConteudoEpisodios(conteudo)}
                            aria-label="Gerenciar episódios"
                            className="text-[#A78BFA] hover:text-white transition-colors cursor-pointer text-lg"
                          >
                            🎬
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => abrirEditar(conteudo)}
                          aria-label="Editar"
                          className="text-[#A78BFA] hover:text-white transition-colors cursor-pointer text-lg"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => aoRemover(conteudo.cd_conteudo, conteudo.nm_titulo)}
                          aria-label="Remover"
                          className="text-red-400 hover:text-red-300 transition-colors cursor-pointer text-lg"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </motion.tbody>
          </table>
        </div>
        <Pagination
          paginaAtual={filtrosAtuais.pagina}
          totalPaginas={totalPaginas}
          onChange={(p) => atualizarUrl({ pagina: p })}
        />
      </div>

      <ConfirmDialog
        aberto={confirmandoExclusao !== null}
        titulo={
          confirmandoExclusao?.tipo === "lote"
            ? `Excluir ${selecionados.size} conteúdo(s)`
            : `Excluir "${confirmandoExclusao?.tipo === "unico" ? confirmandoExclusao.titulo : ""}"`
        }
        descricao="Essa ação remove o conteúdo do catálogo imediatamente. É possível restaurar depois pela tela de Auditoria, a partir do registro da exclusão."
        palavraConfirmacao="EXCLUIR"
        confirmando={excluindo}
        onConfirmar={confirmarExclusao}
        onCancelar={() => setConfirmandoExclusao(null)}
      />

      {/* Modal Adicionar/Editar Fullscreen */}
      <AnimatePresence>
      {modalAberto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[8px] overflow-y-auto p-4 select-none"
        >
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="catalogo-modal-titulo"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative w-full max-w-4xl rounded-lg border border-[rgba(139,92,246,0.2)] bg-[#0D0A1A] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="mb-6 flex items-center justify-between border-b border-[rgba(139,92,246,0.15)] pb-4">
              <h2 id="catalogo-modal-titulo" className="text-xl font-bold text-white">
                {modoEdicao ? "Editar Conteúdo" : "Adicionar Conteúdo"}
              </h2>
              <button
                type="button"
                onClick={fecharModal}
                className="text-[#A78BFA] hover:text-white text-2xl transition-colors cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={aoSubmeter} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {/* Left Column Fields */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="nm_titulo" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    id="nm_titulo"
                    name="nm_titulo"
                    required
                    defaultValue={conteudoEdicao?.nm_titulo || ""}
                    className="w-full bg-[#0D0A1A] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                  />
                </div>

                <div>
                  <label htmlFor="nm_categoria_select" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                    Categoria *
                  </label>
                  <select
                    id="nm_categoria_select"
                    value={categoriaSelecionada}
                    onChange={(e) => setCategoriaSelecionada(e.target.value)}
                    className="w-full bg-[#0D0A1A] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white mb-2"
                  >
                    {categoriasDisponiveis.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="CRIAR_NOVA">+ Digitar nova categoria...</option>
                  </select>

                  {categoriaSelecionada === "CRIAR_NOVA" && (
                    <input
                      type="text"
                      placeholder="Nova categoria"
                      required
                      value={novaCategoria}
                      onChange={(e) => setNovaCategoria(e.target.value)}
                      className="w-full bg-[#0D0A1A] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="tp_formato" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                      Formato
                    </label>
                    <select
                      id="tp_formato"
                      name="tp_formato"
                      defaultValue={conteudoEdicao?.tp_formato || "FILME"}
                      className="w-full bg-[#0D0A1A] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                    >
                      <option value="FILME">FILME</option>
                      <option value="SERIE">SERIE</option>
                      <option value="DOCUMENTARIO">DOCUMENTARIO</option>
                      <option value="AULA">AULA</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="nm_idioma" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                      Idioma
                    </label>
                    <input
                      type="text"
                      id="nm_idioma"
                      name="nm_idioma"
                      defaultValue={conteudoEdicao?.nm_idioma || ""}
                      className="w-full bg-[#0D0A1A] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="ds_generos" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                    Gêneros
                  </label>
                  <input
                    type="text"
                    id="ds_generos"
                    name="ds_generos"
                    placeholder="Dorama, Romance, Ficção científica"
                    defaultValue={conteudoEdicao?.ds_generos || ""}
                    className="w-full bg-[#0D0A1A] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                  />
                </div>

                <div>
                  <label htmlFor="nm_app_origem" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                    App de origem — digite qualquer nome, não é uma lista fechada
                  </label>
                  <input
                    type="text"
                    id="nm_app_origem"
                    name="nm_app_origem"
                    placeholder="Digite o nome do app (ex: ReelShort, DramaWave, ou um novo)"
                    value={appOrigemValor}
                    onChange={(e) => setAppOrigemValor(e.target.value)}
                    className="w-full bg-[#0D0A1A] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                  />
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {["ReelShort", "DramaBox", "ShortMax", "MoboReels", "DramaWave"].map((app) => (
                      <button
                        key={app}
                        type="button"
                        onClick={() => setAppOrigemValor(app)}
                        className="rounded-full border border-[rgba(139,92,246,0.3)] px-2.5 py-1 text-[11px] text-[#A78BFA] transition-colors hover:border-[#9D4EDD] hover:text-white"
                      >
                        {app}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="ds_descricao" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                    Descrição
                  </label>
                  <textarea
                    id="ds_descricao"
                    name="ds_descricao"
                    rows={4}
                    defaultValue={conteudoEdicao?.ds_descricao || ""}
                    className="w-full bg-[#0D0A1A] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="vl_aluguel" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                      Valor Aluguel
                    </label>
                    <input
                      type="number"
                      id="vl_aluguel"
                      name="vl_aluguel"
                      min="0"
                      step="0.01"
                      defaultValue={conteudoEdicao?.vl_aluguel ?? ""}
                      className="w-full bg-[#0D0A1A] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="vl_vitalicio" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                      Valor Vitalício
                    </label>
                    <input
                      type="number"
                      id="vl_vitalicio"
                      name="vl_vitalicio"
                      min="0"
                      step="0.01"
                      defaultValue={conteudoEdicao?.vl_vitalicio ?? ""}
                      className="w-full bg-[#0D0A1A] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column Fields */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label htmlFor="ds_url_poster" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                        URL do Poster
                      </label>
                      <input
                        type="text"
                        id="ds_url_poster"
                        placeholder="https://..."
                        value={urlPoster}
                        onChange={(e) => setUrlPoster(e.target.value)}
                        className="w-full bg-[#0D0A1A] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                      />
                    </div>

                    <div className="shrink-0 flex items-end">
                      {urlPoster && urlPoster.startsWith("http") ? (
                        <img
                          src={otimizarUrlPoster(urlPoster, 130) ?? undefined}
                          alt="Poster preview"
                          className="w-16 h-24 object-cover rounded border border-[rgba(139,92,246,0.3)]"
                        />
                      ) : (
                        <div className="w-16 h-24 bg-[#050208] border border-dashed border-[rgba(139,92,246,0.3)] rounded flex items-center justify-center text-center text-[9px] text-[#A78BFA]/50 p-1">
                          No preview
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="ds_url_bunny" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                      URL Bunny Video
                    </label>
                    <input
                      type="text"
                      id="ds_url_bunny"
                      name="ds_url_bunny"
                      placeholder="https://..."
                      defaultValue={conteudoEdicao?.ds_url_bunny || ""}
                      className="w-full bg-[#0D0A1A] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="ds_file_id_telegram" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                      Telegram File ID
                    </label>
                    <input
                      type="text"
                      id="ds_file_id_telegram"
                      name="ds_file_id_telegram"
                      defaultValue={conteudoEdicao?.ds_file_id_telegram || ""}
                      className="w-full bg-[#0D0A1A] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                    />
                  </div>

                  <div className="rounded-md border border-dashed border-[rgba(139,92,246,0.25)] p-3">
                    <p className="mb-3 text-xs font-semibold uppercase text-[#A78BFA]">
                      Versão Legendada (opcional)
                    </p>
                    <p className="mb-3 text-[11px] text-[#A78BFA]/70">
                      Preencha só se essa novela tiver as duas versões. Deixe em branco pra usar
                      só o dublado — o cliente escolhe a faixa no player quando os dois existirem.
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="ds_url_bunny_legendado" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                          URL Bunny Video (Legendado)
                        </label>
                        <input
                          type="text"
                          id="ds_url_bunny_legendado"
                          name="ds_url_bunny_legendado"
                          placeholder="https://..."
                          defaultValue={conteudoEdicao?.ds_url_bunny_legendado || ""}
                          className="w-full bg-[#0D0A1A] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor="ds_file_id_telegram_legendado" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                          Telegram File ID (Legendado)
                        </label>
                        <input
                          type="text"
                          id="ds_file_id_telegram_legendado"
                          name="ds_file_id_telegram_legendado"
                          defaultValue={conteudoEdicao?.ds_file_id_telegram_legendado || ""}
                          className="w-full bg-[#0D0A1A] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="tp_fonte_prioritaria" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                        Fonte Prioritária
                      </label>
                      <select
                        id="tp_fonte_prioritaria"
                        name="tp_fonte_prioritaria"
                        defaultValue={conteudoEdicao?.tp_fonte_prioritaria || "LOCAL"}
                        className="w-full bg-[#0D0A1A] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                      >
                        <option value="LOCAL">LOCAL</option>
                        <option value="BUNNY">BUNNY</option>
                        <option value="TELEGRAM">TELEGRAM</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="dt_lancamento" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                        Data de Lançamento
                      </label>
                      <input
                        type="date"
                        id="dt_lancamento"
                        name="dt_lancamento"
                        defaultValue={
                          conteudoEdicao?.dt_lancamento
                            ? new Date(conteudoEdicao.dt_lancamento)
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        className="w-full bg-[#0D0A1A] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center pt-2">
                    <input
                      type="checkbox"
                      id="sn_destaque"
                      name="sn_destaque"
                      defaultChecked={conteudoEdicao?.sn_destaque}
                      className="h-4 w-4 rounded border-[rgba(139,92,246,0.3)] bg-[#0D0A1A] text-[#7B2FBE] focus:ring-[#9D4EDD] cursor-pointer"
                    />
                    <label htmlFor="sn_destaque" className="ml-2 text-xs font-semibold text-[#A78BFA] uppercase cursor-pointer">
                      Destacar na Home
                    </label>
                  </div>

                  <div className="flex items-center pt-2">
                    <input
                      type="checkbox"
                      id="sn_exclusivo_assinantes"
                      name="sn_exclusivo_assinantes"
                      defaultChecked={conteudoEdicao?.sn_exclusivo_assinantes}
                      className="h-4 w-4 rounded border-[rgba(139,92,246,0.3)] bg-[#0D0A1A] text-[#7B2FBE] focus:ring-[#9D4EDD] cursor-pointer"
                    />
                    <label htmlFor="sn_exclusivo_assinantes" className="ml-2 text-xs font-semibold text-[#A78BFA] uppercase cursor-pointer">
                      Exclusivo para assinantes (oculto da home/catálogo pra quem não assina)
                    </label>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-[rgba(139,92,246,0.15)] mt-4">
                  <button
                    type="button"
                    onClick={fecharModal}
                    className="rounded-md border border-[rgba(255,255,255,0.2)] hover:bg-white/5 px-6 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvando}
                    className="rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] disabled:opacity-50 px-6 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer flex items-center justify-center"
                  >
                    {salvando ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {conteudoEpisodios && (
        <EpisodiosDrawer
          cdConteudo={conteudoEpisodios.cd_conteudo}
          nmTitulo={conteudoEpisodios.nm_titulo}
          aberto={conteudoEpisodios !== null}
          onFechar={() => setConteudoEpisodios(null)}
        />
      )}
    </div>
  );
}
