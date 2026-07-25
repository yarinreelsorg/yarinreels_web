"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

type TipoToast = "sucesso" | "erro";

interface Toast {
  id: number;
  tipo: TipoToast;
  mensagem: string;
}

interface ToastContextValue {
  sucesso: (mensagem: string) => void;
  erro: (mensagem: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DURACAO_MS = 5000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const proximoId = useRef(0);

  const remover = useCallback((id: number) => {
    setToasts((atual) => atual.filter((t) => t.id !== id));
  }, []);

  const adicionar = useCallback(
    (tipo: TipoToast, mensagem: string) => {
      const id = proximoId.current++;
      setToasts((atual) => [...atual, { id, tipo, mensagem }]);
      setTimeout(() => remover(id), DURACAO_MS);
    },
    [remover]
  );

  const valor: ToastContextValue = {
    sucesso: (mensagem: string) => adicionar("sucesso", mensagem),
    erro: (mensagem: string) => adicionar("erro", mensagem),
  };

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-4 right-4 z-[200] flex w-full max-w-sm flex-col gap-2"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              role="status"
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className={`flex items-start gap-3 rounded-lg border p-4 shadow-2xl backdrop-blur-sm ${
                toast.tipo === "sucesso"
                  ? "border-emerald-500/30 bg-emerald-950/90 text-emerald-200"
                  : "border-red-500/30 bg-red-950/90 text-red-200"
              }`}
            >
              <span className="text-lg leading-none">
                {toast.tipo === "sucesso" ? "✅" : "⚠️"}
              </span>
              <p className="flex-1 text-sm font-medium">{toast.mensagem}</p>
              <button
                type="button"
                onClick={() => remover(toast.id)}
                aria-label="Fechar aviso"
                className="text-white/50 transition-colors hover:text-white"
              >
                &times;
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const contexto = useContext(ToastContext);
  if (!contexto) {
    throw new Error("useToast precisa estar dentro de um ToastProvider.");
  }
  return contexto;
}
