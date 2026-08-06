"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { atualizarAvatar } from "@/app/(public)/conta/actions";
import { AVATARES_DISPONIVEIS, avatarAleatorio } from "@/lib/avatares";
import { useFocoModal } from "@/components/admin/useFocoModal";

export default function SeletorAvatar({ avatarAtual }: { avatarAtual: string | null }) {
  const [avatar, setAvatar] = useState(avatarAtual);
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const modalRef = useFocoModal<HTMLDivElement>(aberto, () => setAberto(false));

  const escolher = async (novoAvatar: string) => {
    setSalvando(true);
    try {
      await atualizarAvatar(novoAvatar);
      setAvatar(novoAvatar);
      setAberto(false);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="Escolher avatar"
        className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-surface text-3xl outline outline-2 outline-offset-2 outline-transparent transition-colors hover:outline-primary/50"
      >
        {avatar ?? "🙂"}
        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white">
          ✎
        </span>
      </button>

      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          >
            <motion.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="w-full max-w-sm rounded-lg border border-border bg-surface p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Escolha seu avatar</h2>
                <button
                  type="button"
                  onClick={() => setAberto(false)}
                  className="text-2xl text-secondary hover:text-foreground"
                >
                  &times;
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {AVATARES_DISPONIVEIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    disabled={salvando}
                    onClick={() => escolher(emoji)}
                    className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl transition-colors disabled:opacity-50 ${
                      avatar === emoji ? "bg-primary/20 outline outline-2 outline-primary" : "bg-background hover:bg-white/10"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={salvando}
                onClick={() => escolher(avatarAleatorio())}
                className="mt-4 w-full rounded-md border border-border py-2.5 text-sm font-bold text-foreground transition-colors hover:border-foreground/40 disabled:opacity-50"
              >
                🎲 Surpreenda-me
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
