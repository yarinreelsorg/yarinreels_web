"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { buttonTap } from "@/lib/motion";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function BotaoInstalarApp() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [modoIOS, setModoIOS] = useState(false);
  const [modalAjuda, setModalAjuda] = useState(false);
  const [jaInstaladoState, setJaInstaladoState] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const ehStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.navigator as any).standalone === true;

    if (ehStandalone) {
      setJaInstaladoState(true);
    }

    const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    setModoIOS(ios);

    function aoDisponibilizar(e: Event) {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", aoDisponibilizar);
    return () => window.removeEventListener("beforeinstallprompt", aoDisponibilizar);
  }, []);

  const aoClicarInstalar = async () => {
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === "accepted") {
          setJaInstaladoState(true);
        }
      } catch (err) {
        console.error("Erro ao instalar PWA:", err);
      }
      return;
    }

    setModalAjuda(true);
  };

  if (jaInstaladoState) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-400">
        <span>✅ Aplicativo Instalado</span>
      </div>
    );
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={aoClicarInstalar}
        {...buttonTap}
        className="flex items-center justify-center gap-2 rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] px-5 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer shadow-md"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.png" alt="Logo" className="h-5 w-5 rounded-sm object-cover" />
        <span>📲 Instalar Aplicativo YarinReels</span>
      </motion.button>

      {modalAjuda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[6px] p-4">
          <div className="w-full max-w-sm rounded-xl border border-[rgba(139,92,246,0.2)] bg-[#0D0A1A] p-6 text-center space-y-4 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.png" alt="Logo" className="mx-auto h-14 w-14 rounded-xl object-cover shadow-lg" />
            <h3 className="text-lg font-bold text-white">Instalar o YarinReels</h3>

            {modoIOS ? (
              <p className="text-xs leading-relaxed text-[#A78BFA]">
                No iPhone/iPad Safari: toque no botão <strong className="text-white">Compartilhar ⬆️</strong> na barra inferior e selecione <strong className="text-white">&quot;Adicionar à Tela de Início&quot;</strong>.
              </p>
            ) : (
              <p className="text-xs leading-relaxed text-[#A78BFA]">
                Abra o menu do seu navegador (três pontinhos <strong className="text-white">⋮</strong>) e clique em <strong className="text-white">&quot;Instalar Aplicativo&quot;</strong> ou <strong className="text-white">&quot;Adicionar à Tela Inicial&quot;</strong>.
              </p>
            )}

            <button
              type="button"
              onClick={() => setModalAjuda(false)}
              className="w-full rounded-md bg-[#7B2FBE] py-2 text-xs font-bold text-white hover:bg-[#6D28D9] cursor-pointer"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
