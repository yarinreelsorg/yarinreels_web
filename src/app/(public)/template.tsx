"use client";

import { motion } from "motion/react";

/**
 * "template.tsx" (diferente de layout.tsx) remonta a cada navegação —
 * é o gancho certo do App Router pra dar uma transição de entrada leve
 * entre páginas (fade + leve subida) sem precisar de AnimatePresence
 * coordenando saída/entrada, que o App Router não suporta nativamente
 * pra troca de rota inteira.
 */
export default function PublicTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
