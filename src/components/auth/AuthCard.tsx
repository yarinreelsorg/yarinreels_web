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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      {/* Fundo ambiente: manchas de cor da marca flutuando bem devagar
          atrás do card, sem interação — só clima, sem competir com o
          formulário. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-background">
        <div
          className="animate-flutuar absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-primary/25 blur-[100px]"
          style={{ animationDelay: "-4s" }}
        />
        <div
          className="animate-flutuar absolute -bottom-32 -right-16 h-[380px] w-[380px] rounded-full bg-accent/20 blur-[100px]"
          style={{ animationDelay: "-11s" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        className="w-full max-w-md"
      >
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2.5 text-2xl font-black tracking-wider text-foreground"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="Logo" className="h-9 w-9 rounded-md object-cover shrink-0" />
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
