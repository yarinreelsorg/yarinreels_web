"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const ITENS = [
  { label: "Início", href: "/", Icone: IconeHome },
  { label: "Minha Lista", href: "/minha-lista", Icone: IconeLista },
  { label: "VIP", href: "/assinaturas", Icone: IconeVip, destaque: true },
  { label: "Suporte", href: "/suporte", Icone: IconeSuporte },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-4 bottom-4 z-[100] flex h-[68px] items-center justify-around rounded-full border border-white/10 bg-[#0a0a0a] px-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.55)] lg:hidden"
    >
      {ITENS.map((item) => (
        <ItemNav key={item.href} item={item} ativo={pathname === item.href} />
      ))}
    </nav>
  );
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  tamanho: number;
}

function ItemNav({
  item,
  ativo,
}: {
  item: (typeof ITENS)[number];
  ativo: boolean;
}) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const proximoIdRef = useRef(0);

  // Ripple exatamente sob o dedo — expande e desaparece em paralelo com
  // o indicador deslizante, confirmando o toque na hora, sem esperar a
  // navegação de fato acontecer.
  function aoTocar(e: React.PointerEvent<HTMLAnchorElement>) {
    const alvo = e.currentTarget.getBoundingClientRect();
    const tamanho = Math.max(alvo.width, alvo.height) * 1.3;
    const id = proximoIdRef.current++;
    setRipples((atual) => [
      ...atual,
      { id, x: e.clientX - alvo.left - tamanho / 2, y: e.clientY - alvo.top - tamanho / 2, tamanho },
    ]);
    window.setTimeout(() => {
      setRipples((atual) => atual.filter((r) => r.id !== id));
    }, 500);
  }

  return (
    <Link
      href={item.href}
      onPointerDown={aoTocar}
      className={`relative flex flex-col items-center gap-1 overflow-hidden rounded-full px-3.5 py-2 text-[10px] font-semibold tracking-wide transition-colors duration-300 active:scale-95 ${
        ativo ? "text-primary" : "text-[#7a7a7a]"
      }`}
    >
      {/* Fundo do item ativo — mesmo layoutId em todo item faz o
          framer-motion animar posição/largura dele deslizando de uma
          aba pra outra, em vez de sumir/reaparecer. */}
      {ativo && (
        <motion.div
          layoutId="nav-indicador-ativo"
          className="absolute inset-0 rounded-full border border-primary/70 bg-primary/15 shadow-[0_0_14px_2px_rgba(194,24,91,0.5),inset_0_0_10px_rgba(230,65,126,0.35)]"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      )}

      {/* Ripple — clicado dentro do mesmo contorno arredondado do item,
          "overflow-hidden" acima corta o círculo nas bordas. */}
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            initial={{ opacity: 0.5, scale: 0 }}
            animate={{ opacity: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="pointer-events-none absolute rounded-full bg-white"
            style={{ left: r.x, top: r.y, width: r.tamanho, height: r.tamanho }}
          />
        ))}
      </AnimatePresence>

      <span className="relative z-10 flex h-6 w-6 items-center justify-center">
        {item.destaque && !ativo && (
          <motion.span
            className="absolute inset-0 rounded-full bg-primary/40"
            animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <item.Icone ativo={ativo} />
      </span>
      <span className="relative z-10 whitespace-nowrap">{item.label.toUpperCase()}</span>
    </Link>
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
