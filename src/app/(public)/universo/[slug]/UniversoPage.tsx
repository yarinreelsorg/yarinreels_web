"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Conteudo } from "@/types/database";
import CardFilme from "@/components/catalog/CardFilme";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";

export default function UniversoPage({
  label,
  cor,
  bannerUrl,
  conteudos,
}: {
  label: string;
  cor: string;
  bannerUrl: string | null;
  conteudos: Conteudo[];
}) {
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setCarregando(false), 350);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative flex h-[300px] w-full items-end overflow-hidden"
      >
        <div className="absolute inset-0">
          {bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bannerUrl}
              alt={label}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-surface" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-black/40" />
        </div>

        <Link
          href="/"
          aria-label="Voltar para o início"
          className="absolute left-6 top-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-xl text-white backdrop-blur-sm transition-colors hover:bg-black/70 sm:left-8 sm:top-8"
        >
          ←
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative z-10 px-6 pb-8 sm:px-10"
        >
          <h1
            className="text-4xl font-black leading-tight text-white sm:text-[48px]"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}
          >
            {label}
          </h1>
          <p className="mt-2 text-sm font-medium text-secondary">
            {conteudos.length} título{conteudos.length === 1 ? "" : "s"}
          </p>
        </motion.div>

        <div className="absolute inset-x-0 bottom-0 h-1" style={{ background: cor }} />
      </motion.section>

      <section className="px-4 py-10 sm:px-8">
        <AnimatePresence mode="wait">
          {carregando ? (
            <motion.div
              key="skeleton"
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
            >
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[2/3] w-full animate-shimmer rounded-[6px] bg-[linear-gradient(110deg,#0d0a1a_30%,#18101f_50%,#0d0a1a_70%)]"
                />
              ))}
            </motion.div>
          ) : conteudos.length === 0 ? (
            <motion.p
              key="vazio"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center text-secondary"
            >
              Nenhum título encontrado neste universo.
            </motion.p>
          ) : (
            <StaggerGroup
              key="grid"
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
              staggerChildren={0.04}
            >
              {conteudos.map((conteudo) => (
                <StaggerItem key={conteudo.cd_conteudo}>
                  <CardFilme conteudo={conteudo} variant="grid" />
                </StaggerItem>
              ))}
            </StaggerGroup>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
