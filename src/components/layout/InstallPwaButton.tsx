"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const CHAVE_DISPENSADO = "yarinreels:pwa-dispensado";

export default function InstallPwaButton() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem(CHAVE_DISPENSADO)) return;

    function aoDisponibilizar(e: Event) {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
      setVisivel(true);
    }

    window.addEventListener("beforeinstallprompt", aoDisponibilizar);
    return () => window.removeEventListener("beforeinstallprompt", aoDisponibilizar);
  }, []);

  async function instalar() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setVisivel(false);
  }

  function dispensar() {
    setVisivel(false);
    window.localStorage.setItem(CHAVE_DISPENSADO, "1");
  }

  if (!visivel) return null;

  return (
    <div className="fixed inset-x-4 bottom-[90px] z-[90] flex items-center justify-between gap-3 rounded-xl border border-primary/40 bg-surface/95 p-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md sm:inset-x-auto sm:right-6 sm:w-80 lg:bottom-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-black text-white">
          YR
        </span>
        <div>
          <p className="text-sm font-bold text-foreground">Instalar o Yarinreels</p>
          <p className="text-xs text-secondary">Acesso rápido direto da tela inicial</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-1.5">
        <button
          type="button"
          onClick={instalar}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-primary-dark"
        >
          Instalar
        </button>
        <button
          type="button"
          onClick={dispensar}
          className="text-[11px] text-secondary hover:text-foreground"
        >
          Agora não
        </button>
      </div>
    </div>
  );
}
