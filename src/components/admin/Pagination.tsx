"use client";

import { motion } from "motion/react";
import { buttonTap, springExpressivo } from "@/lib/motion";

export default function Pagination({
  paginaAtual,
  totalPaginas,
  onChange,
}: {
  paginaAtual: number;
  totalPaginas: number;
  onChange: (pagina: number) => void;
}) {
  if (totalPaginas <= 1) return null;

  const paginas = Array.from({ length: totalPaginas }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPaginas || Math.abs(p - paginaAtual) <= 1
  );

  return (
    <div className="flex items-center justify-center gap-1.5 px-6 py-4 border-t border-[rgba(139,92,246,0.15)]">
      <motion.button
        type="button"
        onClick={() => onChange(paginaAtual - 1)}
        disabled={paginaAtual === 1}
        {...buttonTap}
        className="rounded-md px-3 py-1.5 text-sm font-semibold text-[#A78BFA] hover:bg-white/5 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
      >
        ‹ Anterior
      </motion.button>

      {paginas.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && paginas[i - 1] !== p - 1 && (
            <span className="px-1 text-[#A78BFA]/50">…</span>
          )}
          <motion.button
            type="button"
            onClick={() => onChange(p)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={springExpressivo}
            className={`relative h-8 w-8 rounded-md text-sm font-semibold cursor-pointer ${
              p === paginaAtual ? "text-white" : "text-[#A78BFA] hover:bg-white/5 hover:text-white"
            }`}
          >
            {p === paginaAtual && (
              <motion.span
                layoutId="admin-pagina-ativa"
                transition={springExpressivo}
                className="absolute inset-0 rounded-md bg-[#7B2FBE]"
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
        className="rounded-md px-3 py-1.5 text-sm font-semibold text-[#A78BFA] hover:bg-white/5 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
      >
        Próxima ›
      </motion.button>
    </div>
  );
}
