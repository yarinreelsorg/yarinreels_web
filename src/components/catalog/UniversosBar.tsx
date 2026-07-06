import Link from "next/link";
import type { Universo } from "@/types/database";

function hexToRgba(hex: string, alpha: number) {
  const valor = hex.replace("#", "");
  const r = parseInt(valor.substring(0, 2), 16);
  const g = parseInt(valor.substring(2, 4), 16);
  const b = parseInt(valor.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function UniversosBar({ universos }: { universos: Universo[] }) {
  if (universos.length === 0) return null;

  return (
    <section className="relative py-6">
      <h2 className="mb-3 px-4 text-lg font-semibold text-foreground sm:px-8">
        Universos
      </h2>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] sm:px-8 [&::-webkit-scrollbar]:hidden">
        {universos.map((universo) => (
          <Link
            key={universo.slug}
            href={`/universo/${universo.slug}`}
            className="group/universo relative block h-[120px] w-[220px] shrink-0 cursor-pointer snap-start overflow-hidden rounded-[10px] border-2 border-transparent bg-surface transition-all duration-300 ease-out hover:scale-[1.04] hover:border-[var(--cor)] hover:shadow-[0_0_20px_var(--cor-glow)]"
            style={
              {
                "--cor": universo.cor,
                "--cor-glow": hexToRgba(universo.cor, 0.5),
              } as React.CSSProperties
            }
          >
            {universo.ds_url_imagem ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={universo.ds_url_imagem}
                alt={universo.label}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-surface" />
            )}

            <div className="absolute inset-0 bg-black/45 transition-opacity duration-300 ease-out group-hover/universo:opacity-0" />

            <div
              className="absolute inset-x-0 bottom-0 h-full transition-opacity duration-300 ease-out group-hover/universo:opacity-0"
              style={{
                background: `linear-gradient(to top, ${hexToRgba(universo.cor, 0.6)}, transparent 70%)`,
              }}
            />

            <span
              className="absolute inset-0 flex items-center justify-center px-3 text-center text-[15px] font-bold text-white"
              style={{ textShadow: "0 2px 6px rgba(0,0,0,0.7)" }}
            >
              {universo.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
