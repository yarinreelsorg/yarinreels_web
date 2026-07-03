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
  const [user, setUser] = useState<User | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  async function sair() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setMenuAberto(false);
    window.location.href = "/";
  }

  const inicial = (user?.user_metadata?.nome ?? user?.email ?? "?")
    .charAt(0)
    .toUpperCase();

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
          {(user ? LINKS_LOGADO : LINKS_DESLOGADO).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-secondary transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center sm:flex">
            <input
              type="search"
              value={onBuscaChange ? busca : buscaLocal}
              onChange={(e) =>
                onBuscaChange
                  ? onBuscaChange(e.target.value)
                  : setBuscaLocal(e.target.value)
              }
              onKeyDown={(e) => {
                if (!onBuscaChange && e.key === "Enter" && buscaLocal.trim()) {
                  router.push(`/catalogo?busca=${encodeURIComponent(buscaLocal.trim())}`);
                }
              }}
              placeholder="Buscar título..."
              className={`rounded-full border border-secondary/30 bg-black/30 px-3.5 py-1.5 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-secondary/50 focus:border-primary ${
                buscaAberta ? "w-48 opacity-100" : "w-0 border-transparent px-0 opacity-0"
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
      </div>

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
