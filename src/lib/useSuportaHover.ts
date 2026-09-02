"use client";

import { useEffect, useState } from "react";

/**
 * true só em dispositivo com hover de verdade (mouse/trackpad). O
 * `whileHover` do framer-motion dispara em cima de "pointerenter" — em
 * touch, o próprio gesto de rolar a tela passa o dedo por cima dos
 * cards e conta como "entrar" neles, disparando a animação de escala
 * no meio da rolagem (trava a tela, a capa "encolhe pra dentro" e não
 * solta). Sem suporte a hover de verdade, nem aplica o efeito.
 */
export function useSuportaHover() {
  const [suporta, setSuporta] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const aoMudar = (e: MediaQueryListEvent) => setSuporta(e.matches);
    Promise.resolve().then(() => setSuporta(mq.matches));
    mq.addEventListener("change", aoMudar);
    return () => mq.removeEventListener("change", aoMudar);
  }, []);

  return suporta;
}
