"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { formatarPreco } from "@/lib/catalogo";
import { buttonTap } from "@/lib/motion";

export default function IndicacaoCard({
  linkIndicacao,
  totalIndicados,
  vlComissaoPendente,
  vlComissaoPaga,
}: {
  linkIndicacao: string;
  totalIndicados: number;
  vlComissaoPendente: number;
  vlComissaoPaga: number;
}) {
  const [copiado, setCopiado] = useState(false);

  async function aoCopiar() {
    try {
      await navigator.clipboard.writeText(linkIndicacao);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // clipboard indisponível — sem fallback melhor aqui
    }
  }

  async function aoCompartilhar() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Yarinreels",
          text: "Assista séries e filmes na Yarinreels!",
          url: linkIndicacao,
        });
      } catch {
        // usuário cancelou — ignora
      }
      return;
    }
    aoCopiar();
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <p className="text-sm font-semibold text-foreground">Indique e ganhe</p>
      <p className="mt-1 text-xs text-secondary">
        Compartilhe seu link — quem se cadastrar por ele e comprar ou assinar gera comissão pra
        você, pra sempre.
      </p>

      <div className="mt-4 flex items-center gap-2 rounded-md border border-dashed border-primary/40 bg-background px-3 py-2.5">
        <p className="flex-1 truncate font-mono text-xs text-foreground">{linkIndicacao}</p>
        <motion.button
          type="button"
          onClick={aoCopiar}
          {...buttonTap}
          className="shrink-0 rounded-md border border-border px-2.5 py-1 text-[11px] font-bold text-foreground transition-colors hover:border-foreground"
        >
          {copiado ? "✓ Copiado" : "Copiar"}
        </motion.button>
      </div>

      <motion.button
        type="button"
        onClick={aoCompartilhar}
        {...buttonTap}
        className="mt-3 w-full rounded-md bg-primary py-2.5 text-xs font-bold text-white transition-colors hover:bg-primary-dark"
      >
        🔗 Compartilhar link
      </motion.button>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/60 pt-4 text-center">
        <div>
          <p className="text-lg font-bold text-foreground">{totalIndicados}</p>
          <p className="text-[10px] uppercase tracking-wide text-secondary">Indicados</p>
        </div>
        <div>
          <p className="text-lg font-bold text-emerald-400">
            {formatarPreco(vlComissaoPendente) ?? "R$ 0,00"}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-secondary">A receber</p>
        </div>
        <div>
          <p className="text-lg font-bold text-secondary">
            {formatarPreco(vlComissaoPaga) ?? "R$ 0,00"}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-secondary">Já recebido</p>
        </div>
      </div>
    </div>
  );
}
