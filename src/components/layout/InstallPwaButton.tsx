"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const CHAVE_DISPENSADO = "yarinreels:pwa-dispensado";

function jaInstalado() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function ehIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function podeMostrar() {
  if (typeof window === "undefined") return false;
  if (window.localStorage.getItem(CHAVE_DISPENSADO)) return false;
  return !jaInstalado();
}

export default function InstallPwaButton() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [modoIOS, setModoIOS] = useState(false);
  const [visivel, setVisivel] = useState(false);

  // O Chrome (principalmente no desktop) só considera o site instalável —
  // e só dispara "beforeinstallprompt" — se existir um service worker
  // registrado com handler de "fetch". Sem isso, o botão nunca aparece,
  // mesmo com manifest correto.
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Só dá pra saber se é iOS/já instalado/dispensado depois de montar no
  // navegador — não existe forma de descobrir isso durante o SSR.
  useEffect(() => {
    if (!podeMostrar()) return;

    if (ehIOS()) {
      Promise.resolve().then(() => {
        setModoIOS(true);
        setVisivel(true);
      });
      return;
    }

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
    <div className="fixed inset-x-4 bottom-[90px] z-[90] flex items-center justify-between gap-3 rounded-xl border border-primary/40 bg-surface p-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] sm:inset-x-auto sm:right-6 sm:w-80 lg:bottom-6">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.png" alt="Logo" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
        <div>
          <p className="text-sm font-bold text-foreground">Instalar o Yarinreels</p>
          {modoIOS ? (
            <p className="text-xs text-secondary">
              Toque em <span className="font-bold text-foreground">Compartilhar ⬆️</span> e depois
              em <span className="font-bold text-foreground">&quot;Adicionar à Tela de Início&quot;</span>
            </p>
          ) : (
            <p className="text-xs text-secondary">Acesso rápido direto da tela inicial</p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-1.5">
        {!modoIOS && (
          <button
            type="button"
            onClick={instalar}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-primary-dark"
          >
            Instalar
          </button>
        )}
        <button
          type="button"
          onClick={dispensar}
          className="text-[11px] text-secondary hover:text-foreground"
        >
          {modoIOS ? "Entendi" : "Agora não"}
        </button>
      </div>
    </div>
  );
}
