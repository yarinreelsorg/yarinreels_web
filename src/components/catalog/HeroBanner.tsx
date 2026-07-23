"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Conteudo } from "@/types/database";
import { formatarPreco, formatarViews } from "@/lib/catalogo";
import { buttonTap } from "@/lib/motion";
import BotaoMinhaLista from "@/components/catalog/BotaoMinhaLista";

const INTERVALO_MS = 6000;

export default function HeroBanner({
  destaques,
  favoritosIds,
  logado,
}: {
  destaques: Conteudo[];
  favoritosIds: string[];
  logado: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (destaques.length <= 1 || pausado) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % destaques.length);
    }, INTERVALO_MS);
    return () => clearInterval(id);
  }, [destaques.length, pausado]);

  if (destaques.length === 0) return null;

  const atual = destaques[index % destaques.length];
  const precoAluguel = formatarPreco(atual.vl_aluguel);

  return (
    <section
      className="relative flex h-[100vh] w-full items-end overflow-hidden"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      {/* Background Images crossfade */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence>
          <motion.div
            key={atual.cd_conteudo}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          >
            {atual.ds_url_poster ? (
              <img
                src={atual.ds_url_poster}
                alt={atual.nm_titulo}
                className="h-full w-full object-cover object-top"
              />
            ) : (
              <div className="h-full w-full bg-surface" />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Double Overlay */}
        <div
          className="absolute inset-0 z-10"
          style={{
            backgroundImage: "linear-gradient(to right, rgba(5,2,8,0.9) 0%, rgba(5,2,8,0) 60%)",
          }}
        />
        <div
          className="absolute inset-0 z-10"
          style={{
            backgroundImage: "linear-gradient(to top, rgba(5,2,8,1) 0%, rgba(5,2,8,0) 40%)",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-40 z-10 bg-gradient-to-b from-black/70 to-transparent" />
      </div>

      {/* Content positioned in bottom left with padding-bottom 80px and padding-left 64px */}
      <AnimatePresence mode="wait">
      <motion.div
        key={atual.cd_conteudo}
        className="relative z-20 max-w-3xl select-none px-4 pb-14 sm:px-8 sm:pb-16 lg:pl-16 lg:pb-20"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <span
          className="mb-4 inline-block rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.1em]"
          style={{
            background: "rgba(139,92,246,0.25)",
            border: "1px solid rgba(139,92,246,0.5)",
            color: "#A78BFA",
          }}
        >
          {atual.nm_categoria || "Destaque"}
        </span>

        <h1 className="text-[32px] font-black leading-[1.1] text-white sm:text-[44px] lg:text-[60px]">
          {atual.nm_titulo}
        </h1>

        {atual.ds_descricao && (
          <p
            className="mt-4 line-clamp-2 max-w-xl text-sm leading-relaxed sm:text-[16px]"
            style={{ color: "#A78BFA" }}
          >
            {atual.ds_descricao}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3 text-[13px] text-[#A78BFA]/85">
          {atual.nm_idioma && <span>{atual.nm_idioma}</span>}
          {atual.nm_idioma && <span>·</span>}
          <span>{atual.tp_formato}</span>
          <span>·</span>
          <span>{formatarViews(atual.nr_views)}</span>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <motion.div {...buttonTap}>
            <Link
              href={`/assistir/${atual.cd_conteudo}`}
              className="inline-block rounded-md bg-white px-5 py-3 text-center font-bold text-black transition-colors hover:bg-white/90 sm:px-8 sm:py-3.5"
            >
              ▶ Assistir
            </Link>
          </motion.div>
          <BotaoMinhaLista
            key={atual.cd_conteudo}
            cdConteudo={atual.cd_conteudo}
            favoritadoInicial={favoritosIds.includes(atual.cd_conteudo)}
            logado={logado}
            className="rounded-md border border-white/25 bg-transparent px-5 py-3 font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/10 sm:px-8 sm:py-3.5"
          />
        </div>

        {precoAluguel && (
          <p className="mt-4 text-sm font-semibold text-[#9D4EDD]">
            Aluguel: {precoAluguel}
          </p>
        )}
      </motion.div>
      </AnimatePresence>

      {destaques.length > 1 && (
        <div className="absolute bottom-14 right-4 z-20 flex gap-2 sm:bottom-16 sm:right-8 lg:bottom-20 lg:right-16">
          {destaques.map((item, i) => (
            <motion.button
              key={item.cd_conteudo}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver destaque ${item.nm_titulo}`}
              className="h-2 rounded-full cursor-pointer"
              animate={{
                width: i === index ? 24 : 8,
                backgroundColor: i === index ? "#9D4EDD" : "rgba(255,255,255,0.3)",
              }}
              whileHover={{ scale: 1.2 }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
