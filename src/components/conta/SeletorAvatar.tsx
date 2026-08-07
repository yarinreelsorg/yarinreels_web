"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { atualizarAvatar } from "@/app/(public)/conta/actions";
import { AVATARES_DISPONIVEIS, avatarAleatorio } from "@/lib/avatares";
import { useFocoModal } from "@/components/admin/useFocoModal";
import Avatar from "@/components/ui/Avatar";

export default function SeletorAvatar({ avatarAtual }: { avatarAtual: string | null }) {
  const [avatar, setAvatar] = useState(avatarAtual);
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [urlFoto, setUrlFoto] = useState("");
  const [erroUrl, setErroUrl] = useState<string | null>(null);
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

  const usarFoto = async () => {
    const url = urlFoto.trim();
    if (!url) return;
    try {
      new URL(url);
    } catch {
      setErroUrl("Cole um link válido (começando com http:// ou https://).");
      return;
    }
    setErroUrl(null);
    await escolher(url);
    setUrlFoto("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="Escolher avatar"
        className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface text-3xl outline outline-2 outline-offset-2 outline-transparent transition-colors hover:outline-primary/50"
      >
        <Avatar valor={avatar} className="h-full w-full" />
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

              <div className="mt-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] font-semibold uppercase text-secondary">ou</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <label className="mt-4 block text-xs font-semibold uppercase text-secondary">
                Usar uma foto sua
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  type="url"
                  value={urlFoto}
                  onChange={(e) => setUrlFoto(e.target.value)}
                  placeholder="Link da foto (https://...)"
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
                />
                <button
                  type="button"
                  disabled={salvando || !urlFoto.trim()}
                  onClick={usarFoto}
                  className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
                >
                  Usar
                </button>
              </div>
              {erroUrl && <p className="mt-1.5 text-xs text-red-400">{erroUrl}</p>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
