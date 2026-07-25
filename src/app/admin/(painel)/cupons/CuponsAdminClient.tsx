"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Cupom, TpDesconto } from "@/types/database";
import { formatarPreco } from "@/lib/catalogo";
import { buttonTap } from "@/lib/motion";
import { useFocoModal } from "@/components/admin/useFocoModal";
import { useToast } from "@/components/admin/ToastProvider";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { alternarAtivoCupom, criarCupom, editarCupom, removerCupom } from "./actions";

export default function CuponsAdminClient({ cuponsInicial }: { cuponsInicial: Cupom[] }) {
  const toast = useToast();
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [cupomEdicao, setCupomEdicao] = useState<Cupom | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [cupomExcluir, setCupomExcluir] = useState<Cupom | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [alterandoId, setAlterandoId] = useState<string | null>(null);

  const fecharModal = () => {
    setModalAberto(false);
    setCupomEdicao(null);
  };

  const modalRef = useFocoModal<HTMLDivElement>(modalAberto, fecharModal);

  const cuponsFiltrados = cuponsInicial.filter((c) =>
    c.cd_codigo.toLowerCase().includes(busca.toLowerCase())
  );

  const abrirAdicionar = () => {
    setCupomEdicao(null);
    setErro(null);
    setModalAberto(true);
  };

  const abrirEditar = (cupom: Cupom) => {
    setCupomEdicao(cupom);
    setErro(null);
    setModalAberto(true);
  };

  const aoSubmeter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const formData = new FormData(e.currentTarget);
      if (cupomEdicao) {
        await editarCupom(cupomEdicao.cd_cupom, formData);
        toast.sucesso("Cupom atualizado.");
      } else {
        await criarCupom(formData);
        toast.sucesso("Cupom criado.");
      }
      fecharModal();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar cupom.");
    } finally {
      setSalvando(false);
    }
  };

  const aoAlternarAtivo = async (cupom: Cupom) => {
    setAlterandoId(cupom.cd_cupom);
    try {
      await alternarAtivoCupom(cupom.cd_cupom, !cupom.sn_ativo);
      toast.sucesso(cupom.sn_ativo ? "Cupom desativado." : "Cupom ativado.");
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : "Erro ao atualizar cupom.");
    } finally {
      setAlterandoId(null);
    }
  };

  const confirmarRemocao = async () => {
    if (!cupomExcluir) return;
    setExcluindo(true);
    try {
      await removerCupom(cupomExcluir.cd_cupom);
      toast.sucesso("Cupom removido.");
      setCupomExcluir(null);
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : "Erro ao remover cupom.");
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Cupons</h1>
          <p className="text-sm text-[#A78BFA]">Cupons de desconto gerenciados pelo painel.</p>
        </div>
        <motion.button
          type="button"
          onClick={abrirAdicionar}
          {...buttonTap}
          className="rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] px-5 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer flex items-center justify-center"
        >
          ＋ Novo Cupom
        </motion.button>
      </div>

      <div className="max-w-md">
        <input
          type="text"
          placeholder="Buscar código..."
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
                <th className="px-6 py-3">Código</th>
                <th className="px-6 py-3">Desconto</th>
                <th className="px-6 py-3">Usos</th>
                <th className="px-6 py-3">Validade</th>
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
              {cuponsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#A78BFA]/70">
                    Nenhum cupom encontrado.
                  </td>
                </tr>
              ) : (
                cuponsFiltrados.map((cupom) => (
                  <motion.tr
                    key={cupom.cd_cupom}
                    variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                    className="hover:bg-[rgba(139,92,246,0.05)] transition-colors"
                  >
                    <td className="px-6 py-4 font-mono font-semibold">{cupom.cd_codigo}</td>
                    <td className="px-6 py-4 text-[#A78BFA]">
                      {cupom.tp_desconto === "PERCENTUAL"
                        ? `${cupom.vl_desconto}%`
                        : formatarPreco(cupom.vl_desconto)}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {cupom.nr_usos_atual}
                      {cupom.nr_usos_maximo ? ` / ${cupom.nr_usos_maximo}` : ""}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {cupom.dt_validade
                        ? new Intl.DateTimeFormat("pt-BR").format(new Date(cupom.dt_validade))
                        : "Sem validade"}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        disabled={alterandoId === cupom.cd_cupom}
                        onClick={() => aoAlternarAtivo(cupom)}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors cursor-pointer disabled:opacity-50 ${
                          cupom.sn_ativo
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                        }`}
                      >
                        {cupom.sn_ativo ? "Ativo" : "Inativo"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => abrirEditar(cupom)}
                          aria-label="Editar"
                          className="text-[#A78BFA] hover:text-white transition-colors cursor-pointer text-lg"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => setCupomExcluir(cupom)}
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
              aria-labelledby="cupom-modal-titulo"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="relative w-full max-w-md rounded-lg border border-[rgba(139,92,246,0.2)] bg-[#0D0A1A] p-6 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between border-b border-[rgba(139,92,246,0.15)] pb-4">
                <h2 id="cupom-modal-titulo" className="text-xl font-bold text-white">
                  {cupomEdicao ? "Editar Cupom" : "Novo Cupom"}
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
                  <label htmlFor="cd_codigo" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                    Código
                  </label>
                  <input
                    type="text"
                    id="cd_codigo"
                    name="cd_codigo"
                    required
                    defaultValue={cupomEdicao?.cd_codigo ?? ""}
                    placeholder="Ex: BEMVINDO10"
                    className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="tp_desconto" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                      Tipo
                    </label>
                    <select
                      id="tp_desconto"
                      name="tp_desconto"
                      defaultValue={cupomEdicao?.tp_desconto ?? ("PERCENTUAL" as TpDesconto)}
                      className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                    >
                      <option value="PERCENTUAL">Percentual (%)</option>
                      <option value="FIXO">Valor fixo (R$)</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="vl_desconto" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                      Valor
                    </label>
                    <input
                      type="number"
                      id="vl_desconto"
                      name="vl_desconto"
                      required
                      min="0.01"
                      step="0.01"
                      defaultValue={cupomEdicao?.vl_desconto ?? ""}
                      className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="nr_usos_maximo" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                      Usos máximos
                    </label>
                    <input
                      type="number"
                      id="nr_usos_maximo"
                      name="nr_usos_maximo"
                      min="1"
                      placeholder="Ilimitado"
                      defaultValue={cupomEdicao?.nr_usos_maximo ?? ""}
                      className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="dt_validade" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                      Validade
                    </label>
                    <input
                      type="date"
                      id="dt_validade"
                      name="dt_validade"
                      defaultValue={cupomEdicao?.dt_validade ?? ""}
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
        aberto={cupomExcluir !== null}
        titulo={`Excluir cupom "${cupomExcluir?.cd_codigo ?? ""}"`}
        descricao="Essa ação remove o cupom permanentemente."
        palavraConfirmacao="EXCLUIR"
        confirmando={excluindo}
        onConfirmar={confirmarRemocao}
        onCancelar={() => setCupomExcluir(null)}
      />
    </div>
  );
}
