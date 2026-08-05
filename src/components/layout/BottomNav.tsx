"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITENS = [
  { label: "Home", href: "/", icone: "🏠" },
  { label: "Minha Lista", href: "/minha-lista", icone: "📂" },
  { label: "Premium", href: "/assinaturas", icone: "🔥" },
  { label: "Suporte", href: "/suporte", icone: "🎧" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[100] flex h-[75px] items-center justify-around border-t border-white/10 bg-[#0a0a0a]">
      {ITENS.map((item) => {
        const ativo = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-colors ${
              ativo ? "text-primary" : "text-[#666]"
            }`}
          >
            <span
              className={`text-2xl transition-transform ${ativo ? "scale-[1.15]" : ""}`}
            >
              {item.icone}
            </span>
            {item.label.toUpperCase()}
          </Link>
        );
      })}
    </nav>
  );
}
