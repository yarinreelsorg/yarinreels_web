"use client";

import Link from "next/link";

export default function ChipsCategorias({ categorias }: { categorias: string[] }) {
  if (categorias.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:px-8 [&::-webkit-scrollbar]:hidden">
      {categorias.map((categoria) => (
        <Link
          key={categoria}
          href={`/catalogo?categoria=${encodeURIComponent(categoria)}`}
          className="shrink-0 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-foreground"
        >
          {categoria}
        </Link>
      ))}
    </div>
  );
}
