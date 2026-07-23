"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import LogoutButton from "@/components/admin/LogoutButton";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";

const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/admin/catalogo", label: "Catálogo", icon: "🎬" },
  { href: "/admin/planos", label: "Planos", icon: "🗂️" },
  { href: "/admin/clientes", label: "Clientes", icon: "👥" },
  { href: "/admin/financeiro", label: "Financeiro", icon: "📊" },
  { href: "/admin/configuracoes", label: "Configurações", icon: "⚙️" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <div className="min-h-screen bg-[#050208] text-[#F1F0FF] lg:flex">
      {/* Barra superior mobile */}
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] px-4 lg:hidden">
        <Link href="/" className="text-lg font-black tracking-wider text-white hover:opacity-90">
          Yarin<span className="text-[#9D4EDD]">Reels</span> <span className="text-xs bg-[#7B2FBE] px-1.5 py-0.5 rounded text-white font-bold ml-1 uppercase">Admin</span>
        </Link>
        <button
          type="button"
          onClick={() => setMenuAberto(true)}
          aria-label="Abrir menu"
          className="flex h-9 w-9 items-center justify-center rounded-md text-xl text-white hover:bg-white/5"
        >
          ☰
        </button>
      </div>

      {/* Overlay mobile */}
      <AnimatePresence>
        {menuAberto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMenuAberto(false)}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar: drawer no mobile, fixa 240px no desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#0D0A1A] border-r border-[rgba(139,92,246,0.15)] transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-[240px] lg:shrink-0 lg:translate-x-0 ${
          menuAberto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo YarinReels no topo */}
        <div className="h-20 px-6 flex items-center border-b border-[rgba(139,92,246,0.15)]">
          <Link href="/" className="text-xl font-black tracking-wider text-white hover:opacity-90">
            Yarin<span className="text-[#9D4EDD]">Reels</span> <span className="text-xs bg-[#7B2FBE] px-1.5 py-0.5 rounded text-white font-bold ml-1 uppercase">Admin</span>
          </Link>
        </div>

        {/* Links de navegação */}
        <StaggerGroup className="flex-1 py-6 px-4 flex flex-col gap-1.5" staggerChildren={0.05}>
          {LINKS.map((link) => {
            const isAtivo = pathname === link.href || (link.href !== "/admin/dashboard" && pathname.startsWith(link.href));
            return (
              <StaggerItem key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMenuAberto(false)}
                  className={`group relative flex items-center gap-3 px-4 py-3 rounded-md text-sm font-semibold transition-colors ${
                    isAtivo ? "" : "hover:bg-white/5"
                  }`}
                >
                  {isAtivo && (
                    <motion.span
                      layoutId="admin-nav-ativo"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      className="absolute inset-0 rounded-md bg-[rgba(139,92,246,0.15)] border-l-[3px] border-[#9D4EDD]"
                    />
                  )}
                  <span className="relative text-base">{link.icon}</span>
                  <span
                    className={`relative transition-colors ${
                      isAtivo ? "text-white" : "text-[#A78BFA] group-hover:text-white"
                    }`}
                  >
                    {link.label}
                  </span>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerGroup>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-[rgba(139,92,246,0.15)] flex flex-col items-center gap-2">
          <Link href="/" className="text-xs text-[#A78BFA] hover:underline hover:text-white">
            ← Voltar para o Site
          </Link>
          <LogoutButton />
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8 min-h-screen bg-[#050208]">
        {children}
      </main>
    </div>
  );
}
