"use client";

import { motion } from "motion/react";
import type { Conteudo } from "@/types/database";
import { springExpressivo } from "@/lib/motion";
import Reveal from "@/components/motion/Reveal";

const BENEFICIOS = [
  "Sem anúncios",
  "Novidades toda semana",
  "Todos os conteúdos liberados",
  "Cancele quando quiser",
];

export default function UpsellSection({ destaques = [] }: { destaques?: Conteudo[] }) {
  const poster1 = destaques[0]?.ds_url_poster;
  const poster2 = destaques[1]?.ds_url_poster;
  const poster3 = destaques[2]?.ds_url_poster;

  return (
    <section
      className="w-full bg-[#0D0A1A] px-6 py-14 sm:px-8 sm:py-20 my-10"
      style={{
        borderTop: "1px solid rgba(123,47,190,0.3)",
        borderBottom: "1px solid rgba(123,47,190,0.3)",
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-between">
        {/* Left Column */}
        <Reveal className="flex max-w-lg flex-col items-start text-left">
          <h2
            className="font-extrabold tracking-tight text-white leading-tight"
            style={{ fontSize: "36px" }}
          >
            Assista tudo, sem limites
          </h2>
          <p
            className="mt-3 font-semibold"
            style={{ fontSize: "20px", color: "#9D4EDD" }}
          >
            Primeiro mês por R$ 20
          </p>

          <ul className="mt-6 flex flex-col gap-3 text-sm text-[#A78BFA] sm:text-base">
            {BENEFICIOS.map((beneficio) => (
              <li key={beneficio} className="flex items-center">
                <span className="text-[#9D4EDD] mr-2.5 font-bold text-lg select-none">✓</span>
                {beneficio}
              </li>
            ))}
          </ul>

          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={springExpressivo}
            className="animate-pulse-roxo mt-9 rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] text-white font-bold transition-colors px-10 cursor-pointer flex items-center justify-center"
            style={{ height: "48px" }}
          >
            Começar agora
          </motion.button>
        </Reveal>

        {/* Right Column with 3 stacked posters in perspective */}
        <Reveal delay={0.15} className="relative hidden h-72 w-80 shrink-0 lg:block select-none">
          {poster1 && (
            <motion.img
              src={poster1}
              alt="Poster 1"
              initial={{ rotate: -12 }}
              whileHover={{ rotate: -6, scale: 1.05 }}
              transition={springExpressivo}
              className="absolute left-0 top-8 h-56 w-40 rounded-lg object-cover shadow-[0_15px_35px_rgba(0,0,0,0.6)] border border-white/10"
            />
          )}
          {poster3 && (
            <motion.img
              src={poster3}
              alt="Poster 3"
              initial={{ rotate: 12 }}
              whileHover={{ rotate: 6, scale: 1.05 }}
              transition={springExpressivo}
              className="absolute right-0 top-8 h-56 w-40 rounded-lg object-cover shadow-[0_15px_35px_rgba(0,0,0,0.6)] border border-white/10"
            />
          )}
          {poster2 && (
            <motion.img
              src={poster2}
              alt="Poster 2"
              initial={{ x: "-50%" }}
              whileHover={{ scale: 1.1 }}
              transition={springExpressivo}
              className="absolute left-1/2 top-2 h-60 w-44 rounded-lg object-cover shadow-[0_25px_50px_rgba(0,0,0,0.8)] border border-white/15 z-10"
            />
          )}
        </Reveal>
      </div>
    </section>
  );
}
