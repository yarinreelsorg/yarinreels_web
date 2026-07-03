"use client";

import { useState } from "react";

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
        <span
          className={`shrink-0 text-lg text-primary transition-transform duration-200 ${
            aberto ? "rotate-45" : ""
          }`}
        >
          +
        </span>
      </button>
      {aberto && (
        <p className="px-5 pb-4 text-sm leading-relaxed text-secondary">
          {resposta}
        </p>
      )}
    </div>
  );
}
