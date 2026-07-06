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
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 block text-center text-xl font-bold tracking-tight text-foreground"
        >
          Yarinreels
        </Link>

        <div className="rounded-lg border border-border bg-surface p-6 sm:p-8">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            {titulo}
          </h1>
          <p className="mt-1 text-sm text-secondary">{subtitulo}</p>

          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
