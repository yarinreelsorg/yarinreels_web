"use client";

import { useRouter } from "next/navigation";

export default function ChipsCategorias({ categorias }: { categorias: string[] }) {
  const router = useRouter();

  if (categorias.length === 0) return null;

  function aoClicar(categoria: string) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    router.push(`/catalogo?categoria=${encodeURIComponent(categoria)}`);
  }

  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:px-8 [&::-webkit-scrollbar]:hidden">
      {categorias.map((categoria) => (
        <button
          key={categoria}
          type="button"
          onClick={() => aoClicar(categoria)}
          className="shrink-0 cursor-pointer rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-foreground"
        >
          {categoria}
        </button>
      ))}
    </div>
  );
}
