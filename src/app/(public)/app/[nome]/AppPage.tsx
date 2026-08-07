"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { Conteudo } from "@/types/database";
import CardFilme from "@/components/catalog/CardFilme";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";

export default function AppPage({
  nmApp,
  dsIcone,
  conteudos,
}: {
  nmApp: string;
  dsIcone: string;
  conteudos: Conteudo[];
}) {
  const ehImagem = dsIcone.startsWith("http://") || dsIcone.startsWith("https://");

  return (
    <div className="flex min-h-screen flex-col">
      <section className="relative flex flex-col items-center gap-3 px-4 pb-8 pt-10 text-center sm:px-8">
        <Link
          href="/"
          aria-label="Voltar para o início"
          className="absolute left-4 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-xl text-white transition-colors hover:bg-white/10 sm:left-8"
        >
          ←
        </Link>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-surface text-4xl"
        >
          {ehImagem ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dsIcone} alt="" className="h-full w-full object-cover" />
          ) : (
            dsIcone
          )}
        </motion.div>

        <div>
          <h1 className="text-2xl font-black text-foreground sm:text-3xl">{nmApp}</h1>
          <p className="mt-1 text-sm text-secondary">
            {conteudos.length} título{conteudos.length === 1 ? "" : "s"} deste app
          </p>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-8">
        {conteudos.length === 0 ? (
          <p className="py-16 text-center text-secondary">
            Nenhum título de {nmApp} por aqui ainda.
          </p>
        ) : (
          <StaggerGroup
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
      </section>
    </div>
  );
}
