"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { ComboPromocional, Conteudo } from "@/types/database";
import { formatarPreco } from "@/lib/catalogo";
import { buttonTap } from "@/lib/motion";
import { useFocoModal } from "@/components/admin/useFocoModal";
import { useToast } from "@/components/admin/ToastProvider";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { alternarAtivoCombo, criarCombo, editarCombo, removerCombo } from "./actions";

export default function CombosAdminClient({
  combosInicial,
  conteudos,
}: {
  combosInicial: ComboPromocional[];
  conteudos: Conteudo[];
}) {
  const toast = useToast();
  const [modalAberto, setModalAberto] = useState(false);
  const [comboEdicao, setComboEdicao] = useState<ComboPromocional | null>(null);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [buscaConteudo, setBuscaConteudo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [comboExcluir, setComboExcluir] = useState<ComboPromocional | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [alterandoId, setAlterandoId] = useState<string | null>(null);

  const conteudosMap = new Map(conteudos.map((c) => [c.cd_conteudo, c]));

  const fecharModal = () => {
    setModalAberto(false);
    setComboEdicao(null);
  };

  const modalRef = useFocoModal<HTMLDivElement>(modalAberto, fecharModal);

  const abrirAdicionar = () => {
    setComboEdicao(null);
    setSelecionados(new Set());
    setBuscaConteudo("");
    setErro(null);
    setModalAberto(true);
  };

  const abrirEditar = (combo: ComboPromocional) => {
    setComboEdicao(combo);
    setSelecionados(new Set(combo.cd_conteudos));
    setBuscaConteudo("");
    setErro(null);
    setModalAberto(true);
  };

  const alternarSelecao = (id: string) => {
    setSelecionados((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });
  };

  const aoSubmeter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const formData = new FormData(e.currentTarget);
      for (const id of selecionados) formData.append("cd_conteudos", id);

      if (comboEdicao) {
        await editarCombo(comboEdicao.cd_combo, formData);
        toast.sucesso("Combo atualizado.");
      } else {
        await criarCombo(formData);
        toast.sucesso("Combo criado.");
      }
      fecharModal();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar combo.");
    } finally {
      setSalvando(false);
    }
  };

  const aoAlternarAtivo = async (combo: ComboPromocional) => {
    setAlterandoId(combo.cd_combo);
    try {
      await alternarAtivoCombo(combo.cd_combo, !combo.sn_ativo);
      toast.sucesso(combo.sn_ativo ? "Combo desativado." : "Combo ativado.");
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : "Erro ao atualizar combo.");
    } finally {
      setAlterandoId(null);
    }
  };

  const confirmarRemocao = async () => {
    if (!comboExcluir) return;
    setExcluindo(true);
    try {
      await removerCombo(comboExcluir.cd_combo);
      toast.sucesso("Combo removido.");
      setComboExcluir(null);
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : "Erro ao remover combo.");
    } finally {
      setExcluindo(false);
    }
  };

  const conteudosFiltrados = conteudos
    .filter((c) => c.nm_titulo.toLowerCase().includes(buscaConteudo.toLowerCase()))
    .slice(0, 60);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Combos Promocionais</h1>
          <p className="text-sm text-[#A78BFA]">Pacotes de conteúdos vendidos por um preço único.</p>
        </div>
        <motion.button
          type="button"
          onClick={abrirAdicionar}
          {...buttonTap}
          className="rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] px-5 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer flex items-center justify-center"
        >
          ＋ Novo Combo
        </motion.button>
      </div>

      <div className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[rgba(139,92,246,0.15)] bg-[#050208]/50 text-xs font-semibold text-[#A78BFA] uppercase tracking-wider">
                <th className="px-6 py-3">Nome</th>
                <th className="px-6 py-3">Conteúdos</th>
                <th className="px-6 py-3">Valor</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <motion.tbody
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.04 } } }}
              className="divide-y divide-[rgba(139,92,246,0.15)] text-sm text-white"
            >
              {combosInicial.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[#A78BFA]/70">
                    Nenhum combo cadastrado.
                  </td>
                </tr>
              ) : (
                combosInicial.map((combo) => (
                  <motion.tr
                    key={combo.cd_combo}
                    variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                    className="hover:bg-[rgba(139,92,246,0.05)] transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold">{combo.nm_combo}</td>
                    <td className="px-6 py-4 text-xs text-[#A78BFA] max-w-xs truncate">
                      {combo.cd_conteudos
                        .map((id) => conteudosMap.get(id)?.nm_titulo ?? "?")
                        .join(", ")}
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#A78BFA]">
                      {formatarPreco(combo.vl_combo)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        disabled={alterandoId === combo.cd_combo}
                        onClick={() => aoAlternarAtivo(combo)}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors cursor-pointer disabled:opacity-50 ${
                          combo.sn_ativo
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                        }`}
                      >
                        {combo.sn_ativo ? "Ativo" : "Inativo"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => abrirEditar(combo)}
                          aria-label="Editar"
                          className="text-[#A78BFA] hover:text-white transition-colors cursor-pointer text-lg"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => setComboExcluir(combo)}
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
              aria-labelledby="combo-modal-titulo"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="relative w-full max-w-md rounded-lg border border-[rgba(139,92,246,0.2)] bg-[#0D0A1A] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="mb-6 flex items-center justify-between border-b border-[rgba(139,92,246,0.15)] pb-4">
                <h2 id="combo-modal-titulo" className="text-xl font-bold text-white">
                  {comboEdicao ? "Editar Combo" : "Novo Combo"}
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
                  <label htmlFor="nm_combo" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                    Nome do Combo
                  </label>
                  <input
                    type="text"
                    id="nm_combo"
                    name="nm_combo"
                    required
                    defaultValue={comboEdicao?.nm_combo ?? ""}
                    className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                  />
                </div>

                <div>
                  <label htmlFor="vl_combo" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                    Valor do Combo (R$)
                  </label>
                  <input
                    type="number"
                    id="vl_combo"
                    name="vl_combo"
                    required
                    min="0.01"
                    step="0.01"
                    defaultValue={comboEdicao?.vl_combo ?? ""}
                    className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                    Conteúdos do combo ({selecionados.size} selecionado(s))
                  </label>
                  <input
                    type="text"
                    placeholder="Buscar título..."
                    value={buscaConteudo}
                    onChange={(e) => setBuscaConteudo(e.target.value)}
                    className="mb-2 w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                  />
                  <div className="max-h-48 overflow-y-auto rounded-md border border-[rgba(139,92,246,0.2)] p-2 space-y-1">
                    {conteudosFiltrados.map((c) => (
                      <label
                        key={c.cd_conteudo}
                        className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-white hover:bg-white/5 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selecionados.has(c.cd_conteudo)}
                          onChange={() => alternarSelecao(c.cd_conteudo)}
                          className="h-4 w-4 rounded border-[rgba(139,92,246,0.3)] bg-[#050208] text-[#7B2FBE] cursor-pointer"
                        />
                        {c.nm_titulo}
                      </label>
                    ))}
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
        aberto={comboExcluir !== null}
        titulo={`Excluir combo "${comboExcluir?.nm_combo ?? ""}"`}
        descricao="Essa ação remove o combo permanentemente."
        palavraConfirmacao="EXCLUIR"
        confirmando={excluindo}
        onConfirmar={confirmarRemocao}
        onCancelar={() => setComboExcluir(null)}
      />
    </div>
  );
}
