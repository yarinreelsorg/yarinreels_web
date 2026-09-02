"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { motion } from "motion/react";
import { alternarFavorito } from "@/app/(public)/minha-lista/actions";
import { buttonTap, springExpressivo } from "@/lib/motion";

export default function BotaoMinhaLista({
  cdConteudo,
  favoritadoInicial,
  logado,
  className,
  style,
  iconeApenas,
}: {
  cdConteudo: string;
  favoritadoInicial: boolean;
  logado: boolean;
  className?: string;
  style?: React.CSSProperties;
  /** Mostra só o ícone de coração, sem o texto "Minha Lista". */
  iconeApenas?: boolean;
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
      {iconeApenas ? (
        <motion.span
          key={favoritado ? "cheio" : "vazio"}
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={springExpressivo}
          className="inline-block"
        >
          {favoritado ? "♥" : "♡"}
        </motion.span>
      ) : favoritado ? (
        "✓ Na Minha Lista"
      ) : (
        "+ Minha Lista"
      )}
    </motion.button>
  );
}
