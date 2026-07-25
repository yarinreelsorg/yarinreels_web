"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useFocoModal } from "./useFocoModal";

/**
 * Diálogo de confirmação por digitação — usado antes de ações destrutivas
 * (excluir conteúdo, excluir plano, excluir em lote). Exige digitar a
 * palavra de confirmação exata pra habilitar o botão, evitando exclusão
 * acidental por clique duplo/apressado.
 */
export default function ConfirmDialog({
  aberto,
  titulo,
  descricao,
  palavraConfirmacao,
  textoConfirmar = "Excluir",
  confirmando,
  onConfirmar,
  onCancelar,
}: {
  aberto: boolean;
  titulo: string;
  descricao: string;
  palavraConfirmacao: string;
  textoConfirmar?: string;
  confirmando: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  const [digitado, setDigitado] = useState("");
  const ref = useFocoModal<HTMLDivElement>(aberto, onCancelar);

  const habilitado = digitado.trim() === palavraConfirmacao && !confirmando;

  const fechar = () => {
    setDigitado("");
    onCancelar();
  };

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-[8px] p-4"
          onClick={fechar}
        >
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-titulo"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative w-full max-w-md rounded-lg border border-red-500/30 bg-[#0D0A1A] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="confirm-dialog-titulo" className="text-lg font-bold text-white">
              {titulo}
            </h2>
            <p className="mt-2 text-sm text-[#A78BFA]">{descricao}</p>

            <p className="mt-4 text-xs font-semibold uppercase text-[#A78BFA]">
              Digite <span className="font-mono text-white">{palavraConfirmacao}</span> para
              confirmar
            </p>
            <input
              type="text"
              autoFocus
              value={digitado}
              onChange={(e) => setDigitado(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && habilitado) onConfirmar();
              }}
              className="mt-1.5 w-full rounded-[6px] border border-[rgba(139,92,246,0.3)] bg-[#050208] p-2.5 font-mono text-white outline-none focus:border-red-400"
            />

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-[rgba(139,92,246,0.15)] pt-4">
              <button
                type="button"
                onClick={fechar}
                className="rounded-md border border-[rgba(255,255,255,0.2)] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/5 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!habilitado}
                onClick={onConfirmar}
                className="rounded-md bg-red-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {confirmando ? "Excluindo..." : textoConfirmar}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
