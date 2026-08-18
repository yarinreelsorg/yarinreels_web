"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Conteudo } from "@/types/database";
import { springExpressivo } from "@/lib/motion";
import Reveal from "@/components/motion/Reveal";
import { otimizarUrlPoster } from "@/lib/catalogo";

const BENEFICIOS = [
  "Sem anúncios",
  "Novidades toda semana",
  "Todos os conteúdos liberados",
  "Cancele quando quiser",
];

const CHAVE_DISPENSADA = "yarinreels:promo-inicial-dispensada";
const LIMITE_SCROLL_PX = 220;

function PromoFlutuante({ hrefPromo }: { hrefPromo: string }) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem(CHAVE_DISPENSADA)) return;

    // Mostra depois de um instante (não some assim que a página carrega).
    const idAparecer = setTimeout(() => setVisivel(true), 600);

    function aoRolar() {
      if (window.scrollY > LIMITE_SCROLL_PX) {
        setVisivel(false);
        window.localStorage.setItem(CHAVE_DISPENSADA, "1");
        window.removeEventListener("scroll", aoRolar);
      }
    }

    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => {
      clearTimeout(idAparecer);
      window.removeEventListener("scroll", aoRolar);
    };
  }, []);

  function dispensar() {
    setVisivel(false);
    window.localStorage.setItem(CHAVE_DISPENSADA, "1");
  }

  return (
    <AnimatePresence>
      {visivel && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          className="animate-pulse-soft fixed inset-x-4 top-[112px] z-[95] flex items-center gap-2 rounded-full bg-primary py-2.5 pl-4 pr-2 text-white shadow-[0_8px_24px_rgba(194,24,91,0.5)] lg:hidden"
        >
          <a href={hrefPromo} className="flex-1 text-center text-xs font-bold">
            🔥 Assine e assista tudo sem limites — primeiro mês R$ 20
          </a>
          <button
            type="button"
            onClick={dispensar}
            aria-label="Fechar"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white/90 hover:bg-white/20"
          >
            ×
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function UpsellSection({
  destaques = [],
  cdPlanoPromo,
}: {
  destaques?: Conteudo[];
  cdPlanoPromo: string | null;
}) {
  const poster1 = otimizarUrlPoster(destaques[0]?.ds_url_poster ?? null, 300);
  const poster2 = otimizarUrlPoster(destaques[1]?.ds_url_poster ?? null, 300);
  const poster3 = otimizarUrlPoster(destaques[2]?.ds_url_poster ?? null, 300);
  const hrefPromo = cdPlanoPromo ? `/checkout/plano/${cdPlanoPromo}` : "/assinaturas";

  return (
    <>
      <PromoFlutuante hrefPromo={hrefPromo} />

      {/* Desktop: seção completa */}
      <section
        className="hidden w-full bg-surface px-6 py-14 sm:px-8 sm:py-20 my-10 lg:block"
        style={{
          borderTop: "1px solid rgba(229,9,20,0.3)",
          borderBottom: "1px solid rgba(229,9,20,0.3)",
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
            className="mt-3 font-semibold text-primary"
            style={{ fontSize: "20px" }}
          >
            Primeiro mês por R$ 20
          </p>

          <ul className="mt-6 flex flex-col gap-3 text-sm text-secondary sm:text-base">
            {BENEFICIOS.map((beneficio) => (
              <li key={beneficio} className="flex items-center">
                <span className="text-primary mr-2.5 font-bold text-lg select-none">✓</span>
                {beneficio}
              </li>
            ))}
          </ul>

          <motion.a
            href={hrefPromo}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={springExpressivo}
            className="animate-pulse-soft mt-9 rounded-md bg-primary hover:bg-primary-dark text-white font-bold transition-colors px-10 cursor-pointer flex items-center justify-center"
            style={{ height: "48px" }}
          >
            Começar agora
          </motion.a>
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
    </>
  );
}
