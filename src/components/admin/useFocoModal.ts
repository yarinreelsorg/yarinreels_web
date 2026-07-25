"use client";

import { useEffect, useRef } from "react";

const SELETOR_FOCAVEIS =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Foco/teclado para modais e drawers: foca o primeiro campo ao abrir,
 * prende o Tab dentro do painel, fecha com Esc e devolve o foco pra quem
 * abriu o modal ao fechar. Retorna o ref pra colocar no elemento com
 * role="dialog".
 */
export function useFocoModal<T extends HTMLElement>(aberto: boolean, aoFechar: () => void) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!aberto) return;

    const focadoAntes = document.activeElement as HTMLElement | null;
    const node = ref.current;

    const pegarFocaveis = () =>
      node ? Array.from(node.querySelectorAll<HTMLElement>(SELETOR_FOCAVEIS)) : [];

    const primeiroCampo = pegarFocaveis()[0];
    primeiroCampo?.focus();

    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        aoFechar();
        return;
      }
      if (e.key !== "Tab") return;

      const focaveis = pegarFocaveis();
      if (focaveis.length === 0) return;

      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];

      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    }

    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      focadoAntes?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  return ref;
}
