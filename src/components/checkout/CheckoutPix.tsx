"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { verificarPagamentoPix } from "@/app/(public)/checkout/actions";
import { buttonTap } from "@/lib/motion";

const INTERVALO_POLL_MS = 4000;

export default function CheckoutPix({
  cdVenda,
  qrcodeImage,
  copiaECola,
  titulo,
  valorFormatado,
  hrefSucesso,
}: {
  cdVenda: string;
  qrcodeImage: string;
  copiaECola: string;
  titulo: string;
  valorFormatado: string;
  hrefSucesso: string;
}) {
  const [status, setStatus] = useState<"pendente" | "paga" | "erro">("pendente");
  const [copiado, setCopiado] = useState(false);
  const intervaloRef = useRef<number | null>(null);

  useEffect(() => {
    intervaloRef.current = window.setInterval(async () => {
      try {
        const resultado = await verificarPagamentoPix(cdVenda);
        if (resultado === "PAGA") {
          setStatus("paga");
          if (intervaloRef.current) window.clearInterval(intervaloRef.current);
        }
      } catch {
        setStatus("erro");
        if (intervaloRef.current) window.clearInterval(intervaloRef.current);
      }
    }, INTERVALO_POLL_MS);

    return () => {
      if (intervaloRef.current) window.clearInterval(intervaloRef.current);
    };
  }, [cdVenda]);

  const copiarCodigo = async () => {
    await navigator.clipboard.writeText(copiaECola);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  if (status === "paga") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-8 text-center"
      >
        <span className="text-5xl">✅</span>
        <h2 className="text-xl font-black text-foreground">Pagamento confirmado!</h2>
        <p className="text-sm text-secondary">Seu acesso a &quot;{titulo}&quot; já está liberado.</p>
        <Link
          href={hrefSucesso}
          className="mt-2 rounded-md bg-primary px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
        >
          Assistir agora
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 rounded-lg border border-border bg-surface p-6 sm:p-8">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Pix</p>
        <h2 className="mt-1 text-lg font-bold text-foreground">{titulo}</h2>
        <p className="mt-1 text-2xl font-black text-primary">{valorFormatado}</p>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`data:image/png;base64,${qrcodeImage}`}
        alt="QR Code Pix"
        className="h-56 w-56 rounded-lg border border-border bg-white p-2"
      />

      <motion.button
        type="button"
        onClick={copiarCodigo}
        {...buttonTap}
        className="w-full max-w-sm truncate rounded-md border border-border bg-background px-4 py-2.5 text-xs text-secondary transition-colors hover:border-foreground/40"
      >
        {copiado ? "Código copiado!" : copiaECola}
      </motion.button>

      <div className="flex items-center gap-2 text-xs text-secondary">
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="h-2 w-2 rounded-full bg-primary"
        />
        {status === "erro" ? "Não foi possível confirmar. Atualize a página." : "Aguardando pagamento..."}
      </div>
    </div>
  );
}
