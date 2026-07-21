"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { motion } from "motion/react";
import { alternarFavorito } from "@/app/(public)/minha-lista/actions";
import { buttonTap } from "@/lib/motion";

export default function BotaoMinhaLista({
  cdConteudo,
  favoritadoInicial,
  logado,
  className,
  style,
}: {
  cdConteudo: string;
  favoritadoInicial: boolean;
  logado: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const router = useRouter();
  const [favoritado, setFavoritado] = useState(favoritadoInicial);
  const [pending, startTransition] = useTransition();

  function aoClicar() {
    if (!logado) {
      router.push(`/login?redirect_to=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    const proximo = !favoritado;
    setFavoritado(proximo);
    startTransition(async () => {
      try {
        await alternarFavorito(cdConteudo);
      } catch {
        setFavoritado(!proximo);
      }
    });
  }

  return (
    <motion.button
      type="button"
      onClick={aoClicar}
      disabled={pending}
      {...buttonTap}
      className={className}
      style={style}
    >
      {favoritado ? "✓ Na Minha Lista" : "+ Minha Lista"}
    </motion.button>
  );
}
