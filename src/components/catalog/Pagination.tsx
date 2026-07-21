"use client";

import { motion } from "motion/react";
import { buttonTap, springExpressivo } from "@/lib/motion";

export default function Pagination({
  paginaAtual,
  totalPaginas,
  onChange,
  layoutId,
}: {
  paginaAtual: number;
  totalPaginas: number;
  onChange: (pagina: number) => void;
  layoutId: string;
}) {
  if (totalPaginas <= 1) return null;

  const paginas = Array.from({ length: totalPaginas }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPaginas || Math.abs(p - paginaAtual) <= 1
  );

  return (
    <div className="mt-4 flex items-center justify-center gap-1.5">
      <motion.button
        type="button"
        onClick={() => onChange(paginaAtual - 1)}
        disabled={paginaAtual === 1}
        {...buttonTap}
        className="rounded-md px-3 py-1.5 text-sm font-semibold text-secondary hover:bg-white/5 hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
      >
        ‹ Anterior
      </motion.button>

      {paginas.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && paginas[i - 1] !== p - 1 && <span className="px-1 text-secondary/50">…</span>}
          <motion.button
            type="button"
            onClick={() => onChange(p)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={springExpressivo}
            className={`relative h-8 w-8 rounded-md text-sm font-semibold cursor-pointer ${
              p === paginaAtual ? "text-white" : "text-secondary hover:bg-white/5 hover:text-foreground"
            }`}
          >
            {p === paginaAtual && (
              <motion.span
                layoutId={layoutId}
                transition={springExpressivo}
                className="absolute inset-0 rounded-md bg-primary"
              />
            )}
            <span className="relative">{p}</span>
          </motion.button>
        </span>
      ))}

      <motion.button
        type="button"
        onClick={() => onChange(paginaAtual + 1)}
        disabled={paginaAtual === totalPaginas}
        {...buttonTap}
        className="rounded-md px-3 py-1.5 text-sm font-semibold text-secondary hover:bg-white/5 hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
      >
        Próxima ›
      </motion.button>
    </div>
  );
}
