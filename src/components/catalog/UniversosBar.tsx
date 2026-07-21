"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import type { Universo } from "@/types/database";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";
import { springExpressivo } from "@/lib/motion";

export default function UniversosBar({ universos }: { universos: Universo[] }) {
  const pathname = usePathname();

  if (universos.length === 0) return null;

  return (
    <section className="relative py-6">
      <h2 className="mb-3 px-4 text-lg font-semibold text-foreground sm:px-8">
        Universos
      </h2>
      <StaggerGroup
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] sm:px-8 [&::-webkit-scrollbar]:hidden"
        staggerChildren={0.06}
      >
        {universos.map((universo) => {
          const isAtivo = pathname === `/universo/${universo.slug}`;

          return (
            <StaggerItem key={universo.slug} className="shrink-0 snap-start">
              <motion.div
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.98 }}
                transition={springExpressivo}
              >
                <Link
                  href={`/universo/${universo.slug}`}
                  className={`group/universo relative block h-[120px] w-[220px] cursor-pointer overflow-hidden rounded-[10px] border-2 transition-colors duration-300 ease-out hover:border-[#9D4EDD] hover:shadow-[0_0_20px_rgba(157,78,221,0.5)] ${
                    isAtivo ? "border-[#9D4EDD]" : "border-transparent"
                  }`}
                  style={{
                    backgroundImage: universo.ds_url_imagem
                      ? `url(${universo.ds_url_imagem})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  {/* Overlay: rgba(0,0,0,0.4) by default, fades on hover, active is rgba(0,0,0,0.1) */}
                  <div
                    className={`absolute inset-0 transition-opacity duration-300 ease-out ${
                      isAtivo ? "bg-black/10" : "bg-black/40 group-hover/universo:opacity-0"
                    }`}
                  />

                  <span
                    className="absolute inset-0 flex items-center justify-center px-3 text-center text-[15px] font-bold text-white z-10"
                    style={{ textShadow: "0 2px 6px rgba(0,0,0,0.7)" }}
                  >
                    {universo.label}
                  </span>
                </Link>
              </motion.div>
            </StaggerItem>
          );
        })}
      </StaggerGroup>
    </section>
  );
}
