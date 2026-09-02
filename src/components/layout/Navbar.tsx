"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { obterLogoSite, obterUsuarioAtual, sairUsuario } from "./navbar-actions";
import Avatar from "@/components/ui/Avatar";

const LOGO_PADRAO = "/icon.png";

interface UsuarioNavbar {
  nm_nome: string | null;
  nm_email: string;
  ds_avatar: string | null;
}

const LINKS = [
  { label: "Início", href: "/" },
  { label: "Catálogo", href: "/catalogo" },
  { label: "Minha Lista", href: "/minha-lista" },
  { label: "Assinar", href: "/assinaturas" },
];

export default function Navbar(props: {
  categorias?: string[];
  busca?: string;
  onBuscaChange?: (valor: string) => void;
}) {
  return (
    <Suspense fallback={<div className="sticky top-0 z-[100] h-[104px]" />}>
      <NavbarInner {...props} />
    </Suspense>
  );
}

function NavbarInner({
  busca,
  onBuscaChange,
}: {
  categorias?: string[];
  busca?: string;
  onBuscaChange?: (valor: string) => void;
}) {
  const router = useRouter();
  const [buscaLocal, setBuscaLocal] = useState("");
  const [menuAberto, setMenuAberto] = useState(false);
  const [user, setUser] = useState<UsuarioNavbar | null>(null);
  const [logoUrl, setLogoUrl] = useState(LOGO_PADRAO);
  const [escondida, setEscondida] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const ultimoScrollRef = useRef(0);

  useEffect(() => {
    obterUsuarioAtual().then(setUser);
    obterLogoSite().then(setLogoUrl);
  }, []);

  // Esconde a navbar ao rolar pra baixo, mostra de novo ao rolar pra
  // cima — só no celular (no desktop os links do menu ficam nela, então
  // ela precisa continuar sempre visível). Transform puro (sem blur), não
  // reintroduz o travamento de scroll que o backdrop-blur causava aqui.
  useEffect(() => {
    function aoRolar() {
      if (window.innerWidth >= 1024) {
        setEscondida(false);
        return;
      }
      const atual = window.scrollY;
      const diferenca = atual - ultimoScrollRef.current;
      if (atual < 80) {
        setEscondida(false);
      } else if (diferenca > 8) {
        setEscondida(true);
      } else if (diferenca < -8) {
        setEscondida(false);
      }
      ultimoScrollRef.current = atual;
    }
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  useEffect(() => {
    function aoClicarFora(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAberto(false);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  async function sair() {
    await sairUsuario();
    setMenuAberto(false);
    window.location.href = "/";
  }

  const inicial = (user?.nm_nome ?? user?.nm_email ?? "?").charAt(0).toUpperCase();

  function aoDigitarBusca(valor: string) {
    if (onBuscaChange) {
      onBuscaChange(valor);
    } else {
      setBuscaLocal(valor);
    }
  }

  function aoPressionarBusca(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!onBuscaChange && e.key === "Enter" && buscaLocal.trim()) {
      router.push(`/catalogo?busca=${encodeURIComponent(buscaLocal.trim())}`);
    }
  }

  return (
    <header
      className={`sticky top-0 z-[100] px-4 pb-3 pt-4 transition-transform duration-300 ease-out sm:px-8 ${
        escondida ? "-translate-y-full" : "translate-y-0"
      }`}
      style={{
        backgroundImage:
          "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 60%, rgba(0,0,0,0) 100%)",
      }}
    >
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
        <h1 className="order-1 flex shrink-0 items-center justify-center gap-2 text-2xl font-black uppercase tracking-[0.2em] text-primary lg:order-none lg:justify-start lg:text-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt="" className="h-7 w-7 rounded-md object-cover lg:h-6 lg:w-6" />
          YarinReels
        </h1>

        <nav className="order-3 hidden shrink-0 items-center gap-6 lg:order-none lg:flex">
          {LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-secondary transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="order-2 flex flex-1 items-center gap-2.5 rounded-xl border border-white/5 bg-[#12101c] px-3.5 py-3 transition-colors duration-200 focus-within:border-primary/60 lg:order-none lg:py-2.5">
          <span className="shrink-0 text-lg">🔍</span>
          <input
            type="search"
            value={onBuscaChange ? busca : buscaLocal}
            onChange={(e) => aoDigitarBusca(e.target.value)}
            onKeyDown={aoPressionarBusca}
            placeholder="Buscar título..."
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-secondary/70"
          />

          {user ? (
            <div ref={menuRef} className="relative shrink-0">
              <motion.button
                type="button"
                onClick={() => setMenuAberto((v) => !v)}
                whileTap={{ scale: 0.88 }}
                className={`flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-white ${
                  user.ds_avatar ? "bg-surface text-base" : "bg-primary text-xs font-bold"
                }`}
              >
                {user.ds_avatar ? (
                  <Avatar valor={user.ds_avatar} className="h-full w-full" />
                ) : (
                  inicial
                )}
              </motion.button>
              <AnimatePresence>
                {menuAberto && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-10 w-48 origin-top-right overflow-hidden rounded-md border border-border bg-surface py-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.6)]"
                  >
                    <Link
                      href="/conta"
                      className="block px-4 py-2 text-sm text-foreground hover:bg-white/5"
                    >
                      Minha Conta
                    </Link>
                    <Link
                      href="/minha-lista"
                      className="block px-4 py-2 text-sm text-foreground hover:bg-white/5"
                    >
                      Minha Lista
                    </Link>
                    <button
                      type="button"
                      onClick={sair}
                      className="block w-full px-4 py-2 text-left text-sm text-foreground hover:bg-white/5"
                    >
                      Sair
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div whileTap={{ scale: 0.92 }} className="shrink-0">
              <Link
                href="/login"
                className="block rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-white"
              >
                Entrar
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </header>
  );
}
