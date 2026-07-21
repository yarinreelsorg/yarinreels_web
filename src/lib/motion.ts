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

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: springSuave },
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
