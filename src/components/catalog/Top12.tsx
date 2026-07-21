"use client";

import type { Conteudo } from "@/types/database";
import CardFilme from "./CardFilme";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";

export default function Top12({ itens }: { itens: Conteudo[] }) {
  if (itens.length === 0) return null;

  return (
    <section className="py-5">
      <h2 className="mb-6 px-4 text-lg font-semibold text-foreground sm:px-8">
        Em Alta
      </h2>
      <StaggerGroup
        className="flex gap-2 overflow-x-auto scroll-smooth px-4 pb-4 pt-2 [scrollbar-width:none] sm:px-8 [&::-webkit-scrollbar]:hidden"
        staggerChildren={0.05}
      >
        {itens.slice(0, 12).map((item, index) => (
          <StaggerItem key={item.cd_conteudo}>
            <CardFilme conteudo={item} variant="top12" rank={index + 1} />
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}
