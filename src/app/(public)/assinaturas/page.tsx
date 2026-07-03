import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import type { Plano } from "@/types/database";

function formatarDuracao(dias: number) {
  if (dias >= 365) {
    const anos = Math.round(dias / 365);
    return anos === 1 ? "Anual" : `${anos} anos`;
  }
  if (dias >= 28 && dias <= 31) return "Mensal";
  if (dias % 30 === 0) return `${dias / 30} meses`;
  return `${dias} dias`;
}

export default async function AssinaturasPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("PLANOS").select("*");
  const planos: Plano[] = data ?? [];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar categorias={[]} />

      <section className="mx-auto w-full max-w-5xl px-4 py-16 text-center sm:px-8">
        <h1 className="text-3xl font-black text-foreground sm:text-4xl">
          Escolha sua assinatura
        </h1>
        <p className="mt-3 text-secondary">
          Acesso liberado ao catálogo enquanto sua assinatura estiver ativa.
          Primeiro mês por <span className="font-bold text-primary">R$ 20</span>.
        </p>

        {planos.length === 0 ? (
          <p className="mt-16 text-secondary">
            Nenhum plano disponível no momento. Volte em breve.
          </p>
        ) : (
          <div className="mt-12 grid gap-6 text-left sm:grid-cols-2 lg:grid-cols-3">
            {planos.map((plano) => (
              <div
                key={plano.cd_plano}
                className="flex flex-col rounded-2xl border border-secondary/20 bg-black/30 p-6 transition-all duration-300 hover:border-primary/60 hover:shadow-[0_18px_50px_rgba(139,92,246,0.25)]"
              >
                <span className="w-fit rounded-full border border-[rgba(139,92,246,0.5)] bg-[rgba(139,92,246,0.2)] px-3 py-1 text-xs font-bold uppercase tracking-wide text-foreground">
                  {plano.nm_categoria}
                </span>

                <h2 className="mt-4 text-xl font-black text-foreground">
                  {plano.nm_plano}
                </h2>
                <p className="mt-1 text-sm text-secondary">
                  {formatarDuracao(plano.nr_dias_validade)} de acesso
                </p>

                <ul className="mt-5 flex flex-col gap-2 text-sm text-secondary">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Sem anúncios
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Catálogo{" "}
                    {plano.nm_categoria.toLowerCase()} liberado
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Cancele quando quiser
                  </li>
                </ul>

                <Link
                  href="/cadastro"
                  className="mt-6 rounded-full bg-primary px-6 py-3 text-center text-sm font-bold text-white shadow-[0_8px_30px_rgba(139,92,246,0.4)] transition-colors hover:bg-primary-dark"
                >
                  Assinar agora
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
