import Link from "next/link";
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.25),transparent_60%)]" />

      <div className="relative z-10 w-full max-w-md">
        <Link
          href="/"
          className="mb-8 block bg-gradient-to-r from-primary to-[#c084fc] bg-clip-text text-center text-2xl font-black tracking-tight text-transparent"
        >
          Yarinreels
        </Link>

        <div className="rounded-2xl border border-secondary/15 bg-black/40 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-sm sm:p-8">
          <h1 className="text-xl font-black text-foreground sm:text-2xl">
            {titulo}
          </h1>
          <p className="mt-1 text-sm text-secondary">{subtitulo}</p>

          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
