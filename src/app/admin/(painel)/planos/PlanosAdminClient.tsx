"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Plano } from "@/types/database";
import { formatarPreco } from "@/lib/catalogo";
import { criarPlano, editarPlano, removerPlano } from "./actions";
import { buttonTap } from "@/lib/motion";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { useFocoModal } from "@/components/admin/useFocoModal";
import { useToast } from "@/components/admin/ToastProvider";

const CATEGORIA_TODAS = "TODAS";

export default function PlanosAdminClient({
  planosInicial,
  categorias,
  assinantesPorPlano,
}: {
  planosInicial: Plano[];
  categorias: string[];
  assinantesPorPlano: Record<string, number>;
}) {
  const toast = useToast();
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [planoEdicao, setPlanoEdicao] = useState<Plano | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [categoriasAdicionais, setCategoriasAdicionais] = useState<string[]>([]);
  const [planoExcluir, setPlanoExcluir] = useState<Plano | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const categoriasDisponiveis = Array.from(new Set([CATEGORIA_TODAS, ...categorias]));

  const planosFiltrados = planosInicial.filter((p) =>
    p.nm_plano.toLowerCase().includes(busca.toLowerCase())
  );

  const fecharModal = () => {
    setModalAberto(false);
    setPlanoEdicao(null);
  };

  const modalRef = useFocoModal<HTMLDivElement>(modalAberto, fecharModal);

  const abrirAdicionar = () => {
    setModoEdicao(false);
    setPlanoEdicao(null);
    setErro(null);
    setCategoriasAdicionais([]);
    setModalAberto(true);
  };

  const abrirEditar = (plano: Plano) => {
    setModoEdicao(true);
    setPlanoEdicao(plano);
    setErro(null);
    setCategoriasAdicionais(plano.nm_categorias_adicionais ?? []);
    setModalAberto(true);
  };

  const aoAlternarCategoriaAdicional = (categoria: string) => {
    setCategoriasAdicionais((atual) =>
      atual.includes(categoria) ? atual.filter((c) => c !== categoria) : [...atual, categoria]
    );
  };

  const aoSubmeter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const formData = new FormData(e.currentTarget);
      for (const categoria of categoriasAdicionais) {
        formData.append("nm_categorias_adicionais", categoria);
      }
      if (modoEdicao && planoEdicao) {
        await editarPlano(planoEdicao.cd_plano, formData);
      } else {
        await criarPlano(formData);
      }
      toast.sucesso(modoEdicao ? "Plano atualizado." : "Plano criado.");
      fecharModal();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar plano.");
    } finally {
      setSalvando(false);
    }
  };

  const confirmarRemocao = async () => {
    if (!planoExcluir) return;
    setExcluindo(true);
    try {
      await removerPlano(planoExcluir.cd_plano);
      toast.sucesso("Plano removido.");
      setPlanoExcluir(null);
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : "Erro ao remover plano.");
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Planos</h1>
          <p className="text-sm text-[#A78BFA]">Gerenciamento dos planos de assinatura.</p>
        </div>
        <motion.button
          type="button"
          onClick={abrirAdicionar}
          {...buttonTap}
          className="rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] px-5 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer flex items-center justify-center"
        >
          ＋ Novo Plano
        </motion.button>
      </div>

      <div className="max-w-md">
        <input
          type="text"
          placeholder="Buscar plano..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full bg-[#0D0A1A] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] py-2 px-4 text-white text-sm"
        />
      </div>

      <div className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[rgba(139,92,246,0.15)] bg-[#050208]/50 text-xs font-semibold text-[#A78BFA] uppercase tracking-wider">
                <th className="px-6 py-3">Nome</th>
                <th className="px-6 py-3">Categoria</th>
                <th className="px-6 py-3">Valor</th>
                <th className="px-6 py-3">Validade</th>
                <th className="px-6 py-3">Assinantes Ativos</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <motion.tbody
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.04 } } }}
              className="divide-y divide-[rgba(139,92,246,0.15)] text-sm text-white"
            >
              {planosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#A78BFA]/70">
                    Nenhum plano encontrado.
                  </td>
                </tr>
              ) : (
                planosFiltrados.map((plano) => (
                  <motion.tr
                    key={plano.cd_plano}
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      show: { opacity: 1, y: 0 },
                    }}
                    className="hover:bg-[rgba(139,92,246,0.05)] transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold">{plano.nm_plano}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        <span className="bg-[#050208] border border-[rgba(139,92,246,0.2)] px-2 py-0.5 rounded text-xs text-[#A78BFA]">
                          {plano.nm_categoria}
                        </span>
                        {plano.nm_categorias_adicionais?.map((cat) => (
                          <span
                            key={cat}
                            className="bg-[#050208] border border-[rgba(139,92,246,0.15)] px-2 py-0.5 rounded text-xs text-[#A78BFA]/70"
                          >
                            +{cat}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#A78BFA]">
                      {formatarPreco(plano.vl_plano)}
                    </td>
                    <td className="px-6 py-4 text-xs">{plano.nr_dias_validade} dias</td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {assinantesPorPlano[plano.cd_plano] ?? 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => abrirEditar(plano)}
                          aria-label="Editar"
                          className="text-[#A78BFA] hover:text-white transition-colors cursor-pointer text-lg"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => setPlanoExcluir(plano)}
                          aria-label="Remover"
                          className="text-red-400 hover:text-red-300 transition-colors cursor-pointer text-lg disabled:opacity-40"
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
      </div>

      <AnimatePresence>
        {modalAberto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[8px] p-4"
          >
            <motion.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="plano-modal-titulo"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="relative w-full max-w-md rounded-lg border border-[rgba(139,92,246,0.2)] bg-[#0D0A1A] p-6 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between border-b border-[rgba(139,92,246,0.15)] pb-4">
                <h2 id="plano-modal-titulo" className="text-xl font-bold text-white">
                  {modoEdicao ? "Editar Plano" : "Novo Plano"}
                </h2>
                <button
                  type="button"
                  onClick={fecharModal}
                  className="text-[#A78BFA] hover:text-white text-2xl transition-colors cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={aoSubmeter} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="nm_plano" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                    Nome do Plano
                  </label>
                  <input
                    type="text"
                    id="nm_plano"
                    name="nm_plano"
                    required
                    defaultValue={planoEdicao?.nm_plano ?? ""}
                    placeholder="Ex: Mensal Asiáticas"
                    className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                  />
                </div>

                <div>
                  <label htmlFor="nm_categoria" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                    Categoria
                  </label>
                  <input
                    list="categorias-plano"
                    id="nm_categoria"
                    name="nm_categoria"
                    required
                    defaultValue={planoEdicao?.nm_categoria ?? CATEGORIA_TODAS}
                    placeholder="TODAS, Dorama, Americano..."
                    className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                  />
                  <datalist id="categorias-plano">
                    {categoriasDisponiveis.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                  <p className="mt-1 text-[11px] text-[#A78BFA]/60">
                    Use “TODAS” para liberar o catálogo inteiro.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                    Categorias adicionais (opcional)
                  </label>
                  <p className="mb-2 text-[11px] text-[#A78BFA]/60">
                    Marque outras categorias que esse plano também deve liberar, além da de
                    cima — ex: um plano &quot;Americanas, Turcas e Brasileiras&quot; marca as três aqui.
                    Sem efeito se a categoria de cima já for &quot;TODAS&quot;.
                  </p>
                  <div className="flex flex-wrap gap-2 rounded-[6px] border border-[rgba(139,92,246,0.3)] bg-[#050208] p-2.5">
                    {categorias.length === 0 ? (
                      <span className="text-xs text-[#A78BFA]/50">
                        Nenhuma outra categoria cadastrada ainda.
                      </span>
                    ) : (
                      categorias.map((cat) => {
                        const marcada = categoriasAdicionais.includes(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => aoAlternarCategoriaAdicional(cat)}
                            className={`rounded-full px-3 py-1 text-xs font-bold transition-colors cursor-pointer ${
                              marcada
                                ? "bg-[#7B2FBE] text-white"
                                : "border border-[rgba(139,92,246,0.3)] text-[#A78BFA] hover:bg-white/5"
                            }`}
                          >
                            {marcada ? "✓ " : "+ "}
                            {cat}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="vl_plano" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                      Valor (R$)
                    </label>
                    <input
                      type="number"
                      id="vl_plano"
                      name="vl_plano"
                      required
                      min="0.01"
                      step="0.01"
                      defaultValue={planoEdicao?.vl_plano ?? ""}
                      className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="nr_dias_validade" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                      Validade (dias)
                    </label>
                    <input
                      type="number"
                      id="nr_dias_validade"
                      name="nr_dias_validade"
                      required
                      min="1"
                      step="1"
                      defaultValue={planoEdicao?.nr_dias_validade ?? 30}
                      className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                    />
                  </div>
                </div>

                {erro && <p className="text-sm text-red-400">{erro}</p>}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[rgba(139,92,246,0.15)] mt-2">
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
                    className="rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] disabled:opacity-50 px-6 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer"
                  >
                    {salvando ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        aberto={planoExcluir !== null}
        titulo={`Excluir "${planoExcluir?.nm_plano ?? ""}"`}
        descricao={
          planoExcluir && (assinantesPorPlano[planoExcluir.cd_plano] ?? 0) > 0
            ? `Este plano tem ${assinantesPorPlano[planoExcluir.cd_plano]} assinante(s) ativo(s). Remover não cancela os acessos já concedidos, mas o plano some da tela de assinaturas. É possível restaurar depois pela tela de Auditoria.`
            : "É possível restaurar depois pela tela de Auditoria, a partir do registro da exclusão."
        }
        palavraConfirmacao="EXCLUIR"
        confirmando={excluindo}
        onConfirmar={confirmarRemocao}
        onCancelar={() => setPlanoExcluir(null)}
      />
    </div>
  );
}
