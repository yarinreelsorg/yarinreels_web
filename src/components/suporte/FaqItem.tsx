"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

export default function FaqItem({
  pergunta,
  resposta,
}: {
  pergunta: string;
  resposta: string;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="overflow-hidden rounded-lg border border-secondary/15 bg-black/20">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-foreground"
      >
        {pergunta}
        <motion.span
          className="shrink-0 text-lg text-primary"
          animate={{ rotate: aberto ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 text-sm leading-relaxed text-secondary">
              {resposta}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
