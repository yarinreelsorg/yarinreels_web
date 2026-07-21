"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Conteudo } from "@/types/database";
import {
  adicionarConteudo,
  editarConteudo,
  removerConteudo,
  toggleDestaque,
} from "./actions";
import Pagination from "@/components/admin/Pagination";
import { buttonTap } from "@/lib/motion";

const ITENS_POR_PAGINA = 15;

export default function CatalogoAdminClient({
  conteudosInicial,
  vendasMensais,
}: {
  conteudosInicial: Conteudo[];
  vendasMensais: Record<string, number>;
}) {
  const [busca, setBusca] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [conteudoEdicao, setConteudoEdicao] = useState<Conteudo | null>(null);

  // Form states
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  const [novaCategoria, setNovaCategoria] = useState("");
  const [urlPoster, setUrlPoster] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Extract unique categories from contents
  const categoriasExistentes = Array.from(
    new Set(conteudosInicial.map((c) => c.nm_categoria).filter(Boolean))
  );

  // Filter contents locally
  const conteudosFiltrados = conteudosInicial.filter((c) =>
    c.nm_titulo.toLowerCase().includes(busca.toLowerCase())
  );

  const totalPaginas = Math.max(1, Math.ceil(conteudosFiltrados.length / ITENS_POR_PAGINA));
  const conteudosPaginados = conteudosFiltrados.slice(
    (paginaAtual - 1) * ITENS_POR_PAGINA,
    paginaAtual * ITENS_POR_PAGINA
  );

  const aoBuscar = (valor: string) => {
    setBusca(valor);
    setPaginaAtual(1);
  };

  const abrirAdicionar = () => {
    setModoEdicao(false);
    setConteudoEdicao(null);
    setCategoriaSelecionada(categoriasExistentes[0] || "CRIAR_NOVA");
    setNovaCategoria("");
    setUrlPoster("");
    setModalAberto(true);
  };

  const abrirEditar = (conteudo: Conteudo) => {
    setModoEdicao(true);
    setConteudoEdicao(conteudo);
    setCategoriaSelecionada(conteudo.nm_categoria);
    setNovaCategoria("");
    setUrlPoster(conteudo.ds_url_poster || "");
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setConteudoEdicao(null);
    setUrlPoster("");
  };

  const aoRemover = async (id: string, titulo: string) => {
    if (window.confirm(`Tem certeza que deseja remover "${titulo}"?`)) {
      try {
        await removerConteudo(id);
      } catch (err: any) {
        alert("Erro ao remover: " + err.message);
      }
    }
  };

  const aoToggleDestaque = async (id: string, valor: boolean) => {
    try {
      await toggleDestaque(id, valor);
    } catch (err: any) {
      alert("Erro ao atualizar destaque: " + err.message);
    }
  };

  const aoSubmeter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSalvando(true);
    try {
      const formData = new FormData(e.currentTarget);
      const cat = categoriaSelecionada === "CRIAR_NOVA" ? novaCategoria : categoriaSelecionada;
      formData.set("nm_categoria", cat);

      if (modoEdicao && conteudoEdicao) {
        await editarConteudo(conteudoEdicao.cd_conteudo, formData);
      } else {
        await adicionarConteudo(formData);
      }
      fecharModal();
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Catálogo</h1>
          <p className="text-sm text-[#A78BFA]">Gerenciamento de filmes, séries e aulas.</p>
        </div>
        <motion.button
          type="button"
          onClick={abrirAdicionar}
          {...buttonTap}
          className="rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] px-5 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer flex items-center justify-center"
        >
          ＋ Adicionar Conteúdo
        </motion.button>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <input
          type="text"
          placeholder="Buscar no catálogo..."
          value={busca}
          onChange={(e) => aoBuscar(e.target.value)}
          className="w-full bg-[#0D0A1A] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] py-2 px-4 text-white text-sm"
        />
      </div>

      {/* Catalog Table */}
      <div className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[rgba(139,92,246,0.15)] bg-[#050208]/50 text-xs font-semibold text-[#A78BFA] uppercase tracking-wider">
                <th className="px-6 py-3 w-20">Poster</th>
                <th className="px-6 py-3">Título</th>
                <th className="px-6 py-3">Categoria</th>
                <th className="px-6 py-3">Formato</th>
                <th className="px-6 py-3">Destaque</th>
                <th className="px-6 py-3">Vendas (mês)</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <motion.tbody
              key={paginaAtual}
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.03 } } }}
              className="divide-y divide-[rgba(139,92,246,0.15)] text-sm text-white"
            >
              {conteudosPaginados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[#A78BFA]/70">
                    Nenhum conteúdo encontrado.
                  </td>
                </tr>
              ) : (
                conteudosPaginados.map((conteudo) => (
                  <motion.tr
                    key={conteudo.cd_conteudo}
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      show: { opacity: 1, y: 0 },
                    }}
                    className="hover:bg-[rgba(139,92,246,0.05)] transition-colors"
                  >
                    <td className="px-6 py-3">
                      {conteudo.ds_url_poster ? (
                        <img
                          src={conteudo.ds_url_poster}
                          alt={conteudo.nm_titulo}
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
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={conteudo.sn_destaque}
                        onChange={(e) => aoToggleDestaque(conteudo.cd_conteudo, e.target.checked)}
                        className="h-4 w-4 rounded border-[rgba(139,92,246,0.3)] bg-[#050208] text-[#7B2FBE] focus:ring-[#9D4EDD] focus:ring-offset-[#0D0A1A] cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {vendasMensais[String(conteudo.cd_conteudo)] ?? 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
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
          paginaAtual={paginaAtual}
          totalPaginas={totalPaginas}
          onChange={setPaginaAtual}
        />
      </div>

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
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative w-full max-w-4xl rounded-lg border border-[rgba(139,92,246,0.2)] bg-[#0D0A1A] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="mb-6 flex items-center justify-between border-b border-[rgba(139,92,246,0.15)] pb-4">
              <h2 className="text-xl font-bold text-white">
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
                    {categoriasExistentes.map((cat) => (
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
                        name="ds_url_poster"
                        value={urlPoster}
                        onChange={(e) => setUrlPoster(e.target.value)}
                        className="w-full bg-[#0D0A1A] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                      />
                    </div>

                    <div className="shrink-0 flex items-end">
                      {urlPoster && urlPoster.startsWith("http") ? (
                        <img
                          src={urlPoster}
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
    </div>
  );
}
