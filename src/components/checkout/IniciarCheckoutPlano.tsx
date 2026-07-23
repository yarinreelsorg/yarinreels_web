"use client";

import { useEffect, useState } from "react";
import { iniciarCheckoutPixPlano, type CheckoutPixResultado } from "@/app/(public)/checkout/actions";
import { formatarPreco } from "@/lib/catalogo";
import CheckoutPix from "./CheckoutPix";

export default function IniciarCheckoutPlano({
  cdPlano,
  titulo,
  valor,
}: {
  cdPlano: string;
  titulo: string;
  valor: number;
}) {
  const [resultado, setResultado] = useState<CheckoutPixResultado | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    iniciarCheckoutPixPlano(cdPlano)
      .then((r) => {
        if (!cancelado) setResultado(r);
      })
      .catch((err) => {
        if (!cancelado) setErro(err instanceof Error ? err.message : "Erro ao gerar o Pix.");
      });
    return () => {
      cancelado = true;
    };
  }, [cdPlano]);

  if (erro) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-8 text-center">
        <span className="text-3xl">⚠️</span>
        <p className="text-sm text-red-400">{erro}</p>
      </div>
    );
  }

  if (!resultado) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-12 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-secondary/30 border-t-primary" />
        <p className="text-sm text-secondary">Gerando o Pix...</p>
      </div>
    );
  }

  return (
    <CheckoutPix
      cdVenda={resultado.cd_venda}
      qrcodeImage={resultado.qrcodeImage}
      copiaECola={resultado.copiaECola}
      titulo={titulo}
      valorFormatado={formatarPreco(valor) ?? ""}
      hrefSucesso="/minha-lista"
    />
  );
}
