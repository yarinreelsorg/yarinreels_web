"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { ReactNode } from "react";

export default function AuthCard({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        className="w-full max-w-md"
      >
        <Link
          href="/"
          className="mb-8 block text-center text-xl font-bold tracking-tight text-foreground"
        >
          Yarinreels
        </Link>

        <div className="rounded-lg border border-border bg-surface p-6 sm:p-8">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            {titulo}
          </h1>
          <p className="mt-1 text-sm text-secondary">{subtitulo}</p>

          <motion.div
            key={titulo}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="mt-6"
          >
            {children}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
