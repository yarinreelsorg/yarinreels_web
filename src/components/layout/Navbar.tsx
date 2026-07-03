"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const LINKS_DESLOGADO = [
  { label: "Início", href: "/" },
  { label: "Catálogo", href: "/catalogo" },
  { label: "Assinaturas", href: "/assinaturas" },
  { label: "Suporte", href: "/suporte" },
];

const LINKS_LOGADO = [
  { label: "Início", href: "/" },
  { label: "Catálogo", href: "/catalogo" },
  { label: "Minha Assinatura", href: "/conta/assinatura" },
  { label: "Minha Lista", href: "/minha-lista" },
];

export default function Navbar({
  categorias,
  categoriaAtiva = null,
  busca,
  onBuscaChange,
  onCategoriaChange,
}: {
  categorias: string[];
  categoriaAtiva?: string | null;
  busca?: string;
  onBuscaChange?: (valor: string) => void;
  onCategoriaChange?: (categoria: string | null) => void;
}) {
  const router = useRouter();
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

  const links = user ? LINKS_LOGADO : LINKS_DESLOGADO;

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
    }
  }

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        rolado
          ? "bg-[rgba(8,4,16,0.95)] shadow-[0_2px_20px_rgba(0,0,0,0.4)] backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <div className="flex items-center gap-4 px-4 py-3 sm:px-8">
        <Link
          href="/"
          className="mr-2 shrink-0 bg-gradient-to-r from-primary to-[#c084fc] bg-clip-text text-xl font-black tracking-tight text-transparent"
        >
          Yarinreels
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-secondary transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          <div className="flex items-center">
            <input
              type="search"
              value={onBuscaChange ? busca : buscaLocal}
              onChange={(e) => aoDigitarBusca(e.target.value)}
              onKeyDown={aoPressionarBusca}
              placeholder="Buscar título..."
              className={`rounded-full border border-secondary/30 bg-black/30 px-3.5 py-1.5 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-secondary/50 focus:border-primary ${
                buscaAberta
                  ? "w-48 opacity-100"
                  : "w-0 border-transparent px-0 opacity-0"
              }`}
            />
            <button
              type="button"
              aria-label="Buscar"
              onClick={() => setBuscaAberta((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-secondary transition-colors hover:text-primary"
            >
              🔍
            </button>
          </div>

          {user ? (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuAberto((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#6d28d9] text-sm font-bold text-white shadow-[0_0_0_2px_rgba(139,92,246,0.4)]"
              >
                {inicial}
              </button>
              {menuAberto && (
                <div className="absolute right-0 top-11 w-48 overflow-hidden rounded-lg border border-primary/30 bg-[rgba(8,4,16,0.98)] py-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
                  <Link
                    href="/conta"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-primary/15"
                  >
                    Minha Conta
                  </Link>
                  <button
                    type="button"
                    onClick={sair}
                    className="block w-full px-4 py-2 text-left text-sm text-foreground hover:bg-primary/15"
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-full border border-secondary/40 px-4 py-1.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(139,92,246,0.4)] transition-colors hover:bg-primary-dark"
              >
                Assinar
              </Link>
            </div>
          )}
        </div>

        {user && (
          <Link
            href="/conta"
            className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#6d28d9] text-sm font-bold text-white shadow-[0_0_0_2px_rgba(139,92,246,0.4)] md:hidden"
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

      {menuMobileAberto && (
        <div
          ref={menuMobileRef}
          className="border-t border-secondary/10 px-4 pb-5 pt-3 sm:px-8 md:hidden"
        >
          <input
            type="search"
            value={onBuscaChange ? busca : buscaLocal}
            onChange={(e) => aoDigitarBusca(e.target.value)}
            onKeyDown={aoPressionarBusca}
            placeholder="Buscar título..."
            className="w-full rounded-full border border-secondary/30 bg-black/30 px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-secondary/50 focus:border-primary"
          />

          <nav className="mt-4 flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuMobileAberto(false)}
                className="rounded-lg px-2 py-2.5 text-sm font-semibold text-secondary transition-colors hover:bg-primary/10 hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-3 border-t border-secondary/10 pt-3">
            {user ? (
              <div className="flex flex-col gap-1">
                <p className="truncate px-2 py-1 text-xs text-secondary">
                  {user.email}
                </p>
                <Link
                  href="/conta"
                  onClick={() => setMenuMobileAberto(false)}
                  className="rounded-lg px-2 py-2.5 text-sm font-semibold text-secondary transition-colors hover:bg-primary/10 hover:text-foreground"
                >
                  Minha Conta
                </Link>
                <button
                  type="button"
                  onClick={sair}
                  className="rounded-lg px-2 py-2.5 text-left text-sm font-semibold text-secondary transition-colors hover:bg-primary/10 hover:text-foreground"
                >
                  Sair
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  onClick={() => setMenuMobileAberto(false)}
                  className="flex-1 rounded-full border border-secondary/40 px-4 py-2.5 text-center text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  onClick={() => setMenuMobileAberto(false)}
                  className="flex-1 rounded-full bg-primary px-4 py-2.5 text-center text-sm font-semibold text-white shadow-[0_4px_16px_rgba(139,92,246,0.4)] transition-colors hover:bg-primary-dark"
                >
                  Assinar
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {categorias.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:px-8 [&::-webkit-scrollbar]:hidden">
          {onCategoriaChange ? (
            <>
              <button
                type="button"
                onClick={() => onCategoriaChange(null)}
                className={`shrink-0 rounded-full border px-3.5 py-1 text-xs font-semibold transition-colors ${
                  categoriaAtiva === null
                    ? "border-primary bg-[rgba(139,92,246,0.2)] text-foreground"
                    : "border-secondary/30 text-secondary hover:border-primary/60 hover:text-foreground"
                }`}
              >
                Todas
              </button>
              {categorias.map((categoria) => (
                <button
                  key={categoria}
                  type="button"
                  onClick={() => onCategoriaChange(categoria)}
                  className={`shrink-0 rounded-full border px-3.5 py-1 text-xs font-semibold capitalize transition-colors ${
                    categoriaAtiva === categoria
                      ? "border-primary bg-[rgba(139,92,246,0.2)] text-foreground"
                      : "border-secondary/30 text-secondary hover:border-primary/60 hover:text-foreground"
                  }`}
                >
                  {categoria}
                </button>
              ))}
            </>
          ) : (
            categorias.map((categoria) => (
              <Link
                key={categoria}
                href={`/catalogo?categoria=${encodeURIComponent(categoria)}`}
                className="shrink-0 rounded-full border border-secondary/30 px-3.5 py-1 text-xs font-semibold capitalize text-secondary transition-colors hover:border-primary/60 hover:text-foreground"
              >
                {categoria}
              </Link>
            ))
          )}
        </div>
      )}
    </header>
  );
}
