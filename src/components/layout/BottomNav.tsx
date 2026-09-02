"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { buttonTap } from "@/lib/motion";

const ITENS = [
  { label: "Início", href: "/", Icone: IconeHome },
  { label: "Minha Lista", href: "/minha-lista", Icone: IconeLista },
  { label: "VIP", href: "/assinaturas", Icone: IconeVip, destaque: true },
  { label: "Suporte", href: "/suporte", Icone: IconeSuporte },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[100] flex h-[72px] items-center justify-around border-t border-white/10 bg-[#0a0a0a] lg:hidden">
      {ITENS.map((item) => {
        const ativo = pathname === item.href;
        return (
          <motion.div key={item.href} {...buttonTap} className="flex-1">
            <Link
              href={item.href}
              className={`flex flex-col items-center gap-1 py-2 text-[10px] font-semibold tracking-wide transition-colors ${
                ativo ? "text-primary" : "text-[#7a7a7a]"
              }`}
            >
              <span className="relative flex h-6 w-6 items-center justify-center">
                {item.destaque && !ativo && (
                  <motion.span
                    className="absolute inset-0 rounded-full bg-primary/40"
                    animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
                <item.Icone ativo={ativo} />
              </span>
              {item.label.toUpperCase()}
            </Link>
          </motion.div>
        );
      })}
    </nav>
  );
}

type PropsIcone = { ativo: boolean };

function IconeHome({ ativo }: PropsIcone) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={ativo ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 9.5V20h12V9.5" />
    </svg>
  );
}

function IconeLista({ ativo }: PropsIcone) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={ativo ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4-7 4V4.5a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function IconeVip({ ativo }: PropsIcone) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={ativo ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8.5 8 11l4-6.5L16 11l4-2.5-1.6 9.5H5.6L4 8.5Z" />
      <path d="M6.5 19.5h11" />
    </svg>
  );
}

function IconeSuporte({ ativo }: PropsIcone) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={ativo ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 13a8 8 0 0 1 16 0" />
      <rect x="3" y="13" width="4" height="6" rx="1.5" />
      <rect x="17" y="13" width="4" height="6" rx="1.5" />
      <path d="M19 19v1a2 2 0 0 1-2 2h-3" />
    </svg>
  );
}
