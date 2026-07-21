"use client";

import { motion } from "motion/react";
import { forwardRef, type ReactNode } from "react";
import { fadeUp, staggerContainer } from "@/lib/motion";

export const StaggerGroup = forwardRef<
  HTMLDivElement,
  {
    children: ReactNode;
    className?: string;
    staggerChildren?: number;
    once?: boolean;
  }
>(function StaggerGroup(
  { children, className, staggerChildren = 0.06, once = true },
  ref
) {
  return (
    <motion.div
      ref={ref}
      className={className}
      variants={staggerContainer(staggerChildren)}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-60px" }}
    >
      {children}
    </motion.div>
  );
});

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={fadeUp}>
      {children}
    </motion.div>
  );
}
