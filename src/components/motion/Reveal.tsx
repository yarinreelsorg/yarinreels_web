"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { fadeUp, springSuave } from "@/lib/motion";

export default function Reveal({
  children,
  className,
  delay = 0,
  once = true,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
}) {
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-80px" }}
      transition={{ ...springSuave, delay }}
    >
      {children}
    </motion.div>
  );
}
