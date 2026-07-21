"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const LINKS = [
  { label: "Início", href: "/" },
  { label: "Séries", href: "/catalogo?formato=SERIE" },
  { label: "Filmes", href: "/catalogo?formato=FILME" },
  { label: "Catálogo", href: "/catalogo" },
  { label: "Minha Lista", href: "/minha-lista" },
];

export default function Navbar(props: {
  categorias?: string[];
  busca?: string;
  onBuscaChange?: (valor: string) => void;
}) {
  return (
    <Suspense fallback={<div className="fixed inset-x-0 top-0 z-[100] h-16" />}>
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [rolado, setRolado] = useState(false);
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [buscaLocal, setBuscaLocal] = useState("");
  const [menuAberto, setMenuAberto] = useState(false);
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuMobileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function aoRolar() {
      setRolado(window.scrollY > 24);
    }
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_evento, sessao) => setUser(sessao?.user ?? null)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function aoClicarFora(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAberto(false);
      }
      if (
        menuMobileRef.current &&
        !menuMobileRef.current.contains(e.target as Node)
      ) {
        setMenuMobileAberto(false);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  async function sair() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setMenuAberto(false);
    setMenuMobileAberto(false);
    window.location.href = "/";
  }

  const inicial = (user?.user_metadata?.nome ?? user?.email ?? "?")
    .charAt(0)
    .toUpperCase();

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
      setMenuMobileAberto(false);
      setBuscaAberta(false);
    }
  }

  function linkAtivo(href: string) {
    const [base, query] = href.split("?");
    if (pathname !== base) return false;
    if (!query) return base === "/catalogo" ? !searchParams.get("formato") : true;
    const params = new URLSearchParams(query);
    return params.get("formato") === searchParams.get("formato");
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[100] h-16 transition-colors duration-300 ${
        rolado
          ? "bg-[var(--navbar-bg)] backdrop-blur-md border-b border-border"
          : "bg-gradient-to-b from-black/50 to-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-6 px-4 sm:px-8">
        <Link
          href="/"
          className="mr-2 shrink-0 text-xl font-black tracking-tight text-white"
        >
          YarinReels
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {LINKS.map((link) => {
            const ativo = linkAtivo(link.href);
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`group relative py-2 text-sm font-medium transition-colors ${
                  ativo ? "text-foreground" : "text-secondary hover:text-foreground"
                }`}
              >
                {link.label}
                <span
                  className={`absolute -bottom-0.5 left-0 h-[2px] rounded-full bg-accent transition-all duration-300 ${
                    ativo ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          <div className="flex items-center">
            <input
              type="search"
              value={onBuscaChange ? busca : buscaLocal}
              onChange={(e) => aoDigitarBusca(e.target.value)}
              onKeyDown={aoPressionarBusca}
              placeholder="Buscar título..."
              className={`rounded-md border border-border bg-surface px-3.5 py-1.5 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-secondary/60 focus:border-accent/50 ${
                buscaAberta
                  ? "w-52 opacity-100"
                  : "w-0 border-transparent px-0 opacity-0"
              }`}
            />
            <button
              type="button"
              aria-label="Buscar"
              onClick={() => setBuscaAberta((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-secondary transition-colors hover:text-foreground"
            >
              🔍
            </button>
          </div>

          {user ? (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuAberto((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white"
              >
                {inicial}
              </button>
              <AnimatePresence>
                {menuAberto && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-11 w-48 origin-top-right overflow-hidden rounded-md border border-border bg-surface py-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.6)]"
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
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-full border border-white/25 px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-white/50"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                Assinar
              </Link>
            </div>
          )}
        </div>

        {user && (
          <Link
            href="/conta"
            className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white md:hidden"
          >
            {inicial}
          </Link>
        )}

        <button
          type="button"
          aria-label={menuMobileAberto ? "Fechar menu" : "Abrir menu"}
          onClick={() => setMenuMobileAberto((v) => !v)}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-foreground md:hidden ${
            user ? "" : "ml-auto"
          }`}
        >
          {menuMobileAberto ? "✕" : "☰"}
        </button>
      </div>

      <AnimatePresence>
      {menuMobileAberto && (
        <motion.div
          ref={menuMobileRef}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="overflow-hidden border-t border-border bg-[var(--navbar-bg)] px-4 pb-5 pt-3 sm:px-8 md:hidden"
        >
          <input
            type="search"
            value={onBuscaChange ? busca : buscaLocal}
            onChange={(e) => aoDigitarBusca(e.target.value)}
            onKeyDown={aoPressionarBusca}
            placeholder="Buscar título..."
            className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-secondary/60 focus:border-accent/50"
          />

          <nav className="mt-4 flex flex-col gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMenuMobileAberto(false)}
                className="rounded-md px-2 py-2.5 text-sm font-medium text-secondary transition-colors hover:bg-white/5 hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-3 border-t border-border pt-3">
            {user ? (
              <div className="flex flex-col gap-1">
                <p className="truncate px-2 py-1 text-xs text-secondary">
                  {user.email}
                </p>
                <Link
                  href="/conta"
                  onClick={() => setMenuMobileAberto(false)}
                  className="rounded-md px-2 py-2.5 text-sm font-medium text-secondary transition-colors hover:bg-white/5 hover:text-foreground"
                >
                  Minha Conta
                </Link>
                <button
                  type="button"
                  onClick={sair}
                  className="rounded-md px-2 py-2.5 text-left text-sm font-medium text-secondary transition-colors hover:bg-white/5 hover:text-foreground"
                >
                  Sair
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  onClick={() => setMenuMobileAberto(false)}
                  className="flex-1 rounded-full border border-white/25 px-4 py-2.5 text-center text-sm font-medium text-foreground transition-colors hover:border-white/50"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  onClick={() => setMenuMobileAberto(false)}
                  className="flex-1 rounded-full bg-primary px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                >
                  Assinar
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </header>
  );
}
