"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Episodio } from "@/types/database";
import { useFocoModal } from "@/components/admin/useFocoModal";
import { useToast } from "@/components/admin/ToastProvider";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { adicionarEpisodio, editarEpisodio, listarEpisodios, removerEpisodio } from "./episodios-actions";

export default function EpisodiosDrawer({
  cdConteudo,
  nmTitulo,
  aberto,
  onFechar,
}: {
  cdConteudo: string;
  nmTitulo: string;
  aberto: boolean;
  onFechar: () => void;
}) {
  const toast = useToast();
  const [episodios, setEpisodios] = useState<Episodio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [episodioEdicao, setEpisodioEdicao] = useState<Episodio | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [excluir, setExcluir] = useState<Episodio | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const drawerRef = useFocoModal<HTMLDivElement>(aberto, onFechar);

  // O componente só existe enquanto a série selecionada estiver aberta
  // (o pai desmonta ao fechar), então montar já equivale a "acabou de abrir".
  useEffect(() => {
    listarEpisodios(cdConteudo)
      .then(setEpisodios)
      .catch(() => toast.erro("Erro ao carregar episódios."))
      .finally(() => setCarregando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cdConteudo]);

  const abrirNovo = () => {
    setEpisodioEdicao(null);
    setFormAberto(true);
  };

  const abrirEdicao = (ep: Episodio) => {
    setEpisodioEdicao(ep);
    setFormAberto(true);
  };

  const aoSubmeter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSalvando(true);
    try {
      const formData = new FormData(e.currentTarget);
      if (episodioEdicao) {
        await editarEpisodio(episodioEdicao.cd_episodio, formData);
        toast.sucesso("Episódio atualizado.");
      } else {
        await adicionarEpisodio(cdConteudo, formData);
        toast.sucesso("Episódio adicionado.");
      }
      setFormAberto(false);
      const atualizados = await listarEpisodios(cdConteudo);
      setEpisodios(atualizados);
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : "Erro ao salvar episódio.");
    } finally {
      setSalvando(false);
    }
  };

  const confirmarExclusao = async () => {
    if (!excluir) return;
    setExcluindo(true);
    try {
      await removerEpisodio(excluir.cd_episodio, cdConteudo);
      toast.sucesso("Episódio removido.");
      setEpisodios((atual) => atual.filter((e) => e.cd_episodio !== excluir.cd_episodio));
      setExcluir(null);
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : "Erro ao remover episódio.");
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <AnimatePresence>
      {aberto && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onFechar}
          />
          <motion.div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="episodios-drawer-titulo"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[480px] bg-[#0D0A1A] border-l border-[rgba(139,92,246,0.2)] p-6 shadow-2xl overflow-y-auto"
          >
            <div className="mb-6 flex items-center justify-between border-b border-[rgba(139,92,246,0.15)] pb-4">
              <div>
                <h2 id="episodios-drawer-titulo" className="text-lg font-bold text-white">
                  Episódios
                </h2>
                <p className="text-xs text-[#A78BFA] mt-0.5 truncate max-w-[320px]">{nmTitulo}</p>
              </div>
              <button
                type="button"
                onClick={onFechar}
                className="text-[#A78BFA] hover:text-white text-2xl transition-colors cursor-pointer"
              >
                &times;
              </button>
            </div>

            <button
              type="button"
              onClick={abrirNovo}
              className="mb-4 w-full rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] px-4 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer"
            >
              ＋ Adicionar Episódio
            </button>

            {carregando ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-[#050208]/60" />
                ))}
              </div>
            ) : episodios.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#A78BFA]/70">
                Nenhum episódio cadastrado ainda.
              </p>
            ) : (
              <div className="space-y-2">
                {episodios.map((ep) => (
                  <div
                    key={ep.cd_episodio}
                    className="flex items-center gap-3 rounded-lg border border-[rgba(139,92,246,0.1)] bg-[#050208]/60 p-3"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0D0A1A] text-xs font-bold text-white">
                      {ep.nr_episodio}
                    </span>
                    <span className="flex-1 truncate text-sm font-medium text-white">
                      {ep.nm_titulo}
                    </span>
                    <button
                      type="button"
                      onClick={() => abrirEdicao(ep)}
                      aria-label="Editar episódio"
                      className="text-[#A78BFA] hover:text-white cursor-pointer"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => setExcluir(ep)}
                      aria-label="Remover episódio"
                      className="text-red-400 hover:text-red-300 cursor-pointer"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}

            <AnimatePresence>
              {formAberto && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-[8px] p-4"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 16 }}
                    transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    role="dialog"
                    aria-modal="true"
                    className="relative w-full max-w-sm rounded-lg border border-[rgba(139,92,246,0.2)] bg-[#0D0A1A] p-6 shadow-2xl"
                  >
                    <h3 className="mb-4 text-lg font-bold text-white">
                      {episodioEdicao ? "Editar Episódio" : "Novo Episódio"}
                    </h3>
                    <form onSubmit={aoSubmeter} className="flex flex-col gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                          Número
                        </label>
                        <input
                          type="number"
                          name="nr_episodio"
                          min="1"
                          required
                          defaultValue={episodioEdicao?.nr_episodio ?? episodios.length + 1}
                          className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                          Título
                        </label>
                        <input
                          type="text"
                          name="nm_titulo"
                          required
                          defaultValue={episodioEdicao?.nm_titulo ?? ""}
                          className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                          URL Bunny Video
                        </label>
                        <input
                          type="text"
                          name="ds_url_bunny"
                          defaultValue={episodioEdicao?.ds_url_bunny ?? ""}
                          className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                          Telegram File ID
                        </label>
                        <input
                          type="text"
                          name="ds_file_id_telegram"
                          defaultValue={episodioEdicao?.ds_file_id_telegram ?? ""}
                          className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-end gap-3 border-t border-[rgba(139,92,246,0.15)] pt-4">
                        <button
                          type="button"
                          onClick={() => setFormAberto(false)}
                          className="rounded-md border border-[rgba(255,255,255,0.2)] hover:bg-white/5 px-5 py-2 text-sm font-bold text-white transition-colors cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={salvando}
                          className="rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] disabled:opacity-50 px-5 py-2 text-sm font-bold text-white transition-colors cursor-pointer"
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
              aberto={excluir !== null}
              titulo={`Excluir episódio ${excluir?.nr_episodio ?? ""}`}
              descricao="Essa ação remove o episódio permanentemente."
              palavraConfirmacao="EXCLUIR"
              confirmando={excluindo}
              onConfirmar={confirmarExclusao}
              onCancelar={() => setExcluir(null)}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
