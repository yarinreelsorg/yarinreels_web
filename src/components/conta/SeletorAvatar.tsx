"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { atualizarAvatar } from "@/app/(public)/conta/actions";
import {
  AVATARES_DISPONIVEIS,
  CATEGORIAS_AVATAR,
  avatarAleatorio,
  type AvatarOpcao,
} from "@/lib/avatares";
import { useFocoModal } from "@/components/admin/useFocoModal";
import Avatar from "@/components/ui/Avatar";

export default function SeletorAvatar({ avatarAtual }: { avatarAtual: string | null }) {
  const [avatar, setAvatar] = useState(avatarAtual);
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>("TODAS");
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

  const avataresFiltrados =
    categoriaAtiva === "TODAS"
      ? AVATARES_DISPONIVEIS
      : AVATARES_DISPONIVEIS.filter((item) => item.categoria === categoriaAtiva);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="Escolher avatar de perfil"
        className="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0D0A1A] text-3xl outline outline-2 outline-offset-2 outline-[#9D4EDD]/30 transition-all hover:scale-105 hover:outline-[#9D4EDD] cursor-pointer shadow-lg"
      >
        <Avatar valor={avatar} className="h-full w-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="text-xs font-bold text-white uppercase tracking-wider">Trocar</span>
        </div>
      </button>

      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[8px] p-4"
          >
            <motion.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="w-full max-w-2xl rounded-xl border border-[rgba(139,92,246,0.2)] bg-[#0D0A1A] p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[rgba(139,92,246,0.15)] pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Escolha o seu Avatar</h2>
                  <p className="text-xs text-[#A78BFA] mt-0.5">
                    Estilo Disney+ & Netflix com personagens, atores e animes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAberto(false)}
                  className="text-2xl text-[#A78BFA] hover:text-white transition-colors cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {/* Filtro de Categorias */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCategoriaAtiva("TODAS")}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    categoriaAtiva === "TODAS"
                      ? "bg-[#9D4EDD] text-white shadow-md"
                      : "bg-[#050208] text-[#A78BFA] border border-[rgba(139,92,246,0.2)] hover:bg-white/5"
                  }`}
                >
                  🌟 Todos
                </button>
                {CATEGORIAS_AVATAR.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoriaAtiva(cat)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      categoriaAtiva === cat
                        ? "bg-[#9D4EDD] text-white shadow-md"
                        : "bg-[#050208] text-[#A78BFA] border border-[rgba(139,92,246,0.2)] hover:bg-white/5"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Grid de Avatares */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 py-2">
                {avataresFiltrados.map((item: AvatarOpcao) => {
                  const selecionado = avatar === item.url;
                  return (
                    <motion.button
                      key={item.id}
                      type="button"
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={salvando}
                      onClick={() => escolher(item.url)}
                      className={`group flex flex-col items-center gap-1.5 rounded-lg p-2 transition-all cursor-pointer disabled:opacity-50 ${
                        selecionado
                          ? "bg-[#7B2FBE]/20 border border-[#9D4EDD]"
                          : "hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <div
                        className={`relative h-16 w-16 overflow-hidden rounded-full border-2 transition-all ${
                          selecionado
                            ? "border-[#9D4EDD] ring-4 ring-[#9D4EDD]/30"
                            : "border-[rgba(139,92,246,0.3)] group-hover:border-white"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.url}
                          alt={item.nome}
                          className="h-full w-full object-cover transition-transform group-hover:scale-110"
                        />
                      </div>
                      <span className="text-[11px] font-medium text-white/90 text-center line-clamp-1">
                        {item.nome}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[rgba(139,92,246,0.15)]">
                <button
                  type="button"
                  disabled={salvando}
                  onClick={() => escolher(avatarAleatorio())}
                  className="w-full sm:w-auto rounded-md border border-[rgba(139,92,246,0.3)] bg-[#050208] px-4 py-2.5 text-xs font-bold text-[#A78BFA] transition-colors hover:bg-white/5 disabled:opacity-50 cursor-pointer"
                >
                  🎲 Escolher Aleatório
                </button>

                {/* Input de link personalizado */}
                <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
                  <input
                    type="url"
                    value={urlFoto}
                    onChange={(e) => setUrlFoto(e.target.value)}
                    placeholder="Ou cole a URL da sua foto (https://...)"
                    className="flex-1 rounded-md border border-[rgba(139,92,246,0.3)] bg-[#050208] px-3 py-2 text-xs text-white outline-none focus:border-[#9D4EDD]"
                  />
                  <button
                    type="button"
                    disabled={salvando || !urlFoto.trim()}
                    onClick={usarFoto}
                    className="shrink-0 rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] px-4 py-2 text-xs font-bold text-white transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Usar URL
                  </button>
                </div>
              </div>
              {erroUrl && <p className="text-xs text-red-400">{erroUrl}</p>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
