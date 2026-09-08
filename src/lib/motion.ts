import type { Transition, Variants } from "motion/react";

export const springExpressivo: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 22,
  mass: 0.9,
};

export const springSuave: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 26,
};

// Duração fixa (não spring) de propósito: fadeUp roda em massa nas
// fileiras de carrossel via StaggerGroup/StaggerItem — muitos cards
// entrando juntos na tela em celular de entrada. Uma mola recalcula
// física a cada frame até "assentar"; uma transição de duração fixa é
// bem mais barata de rodar em paralelo, mesmo perdendo o efeito de
// balanço no final.
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: "easeOut" } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
};

export const staggerContainer = (
  staggerChildren = 0.06,
  delayChildren = 0
): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren, delayChildren },
  },
});

export const cardHover = {
  whileHover: { scale: 1.08, transition: springExpressivo },
  whileTap: { scale: 0.96 },
};

export const buttonTap = {
  whileHover: { scale: 1.04 },
  whileTap: { scale: 0.95 },
};
