import Link from "next/link";

export function SecaoTitulo({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-[18px] font-bold text-foreground"
      style={{ borderLeft: "3px solid #7B2FBE", paddingLeft: "12px" }}
    >
      {children}
    </h2>
  );
}

export function EstadoVazio({ texto }: { texto: string }) {
  return (
    <div className="mt-4 flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-12 text-center">
      <span className="text-3xl">🎬</span>
      <p className="text-sm text-secondary">{texto}</p>
      <Link
        href="/catalogo"
        className="mt-1 rounded-md bg-primary px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
      >
        Explorar catálogo
      </Link>
    </div>
  );
}
