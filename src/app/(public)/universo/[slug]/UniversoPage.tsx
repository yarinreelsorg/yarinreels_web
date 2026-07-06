"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Conteudo } from "@/types/database";
import CardFilme from "@/components/catalog/CardFilme";

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
      <section className="relative flex h-[300px] w-full items-end overflow-hidden">
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

        <div className="relative z-10 px-6 pb-8 sm:px-10">
          <h1
            className="text-4xl font-black leading-tight text-white sm:text-[48px]"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}
          >
            {label}
          </h1>
          <p className="mt-2 text-sm font-medium text-secondary">
            {conteudos.length} título{conteudos.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-1" style={{ background: cor }} />
      </section>

      <section className="px-4 py-10 sm:px-8">
        {carregando ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[2/3] w-full animate-shimmer rounded-[6px] bg-[linear-gradient(110deg,#0d0a1a_30%,#18101f_50%,#0d0a1a_70%)]"
              />
            ))}
          </div>
        ) : conteudos.length === 0 ? (
          <p className="py-16 text-center text-secondary">
            Nenhum título encontrado neste universo.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {conteudos.map((conteudo) => (
              <CardFilme
                key={conteudo.cd_conteudo}
                conteudo={conteudo}
                variant="grid"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
