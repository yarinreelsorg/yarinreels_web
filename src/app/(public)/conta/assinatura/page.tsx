import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import { diasRestantes as calcularDiasRestantes, estaExpirada } from "@/lib/catalogo";
import type { Plano, Venda } from "@/types/database";

function formatarData(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export default async function ContaAssinaturaPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const nrIdTelegram =
    typeof user.user_metadata?.nr_id_telegram === "number"
      ? (user.user_metadata.nr_id_telegram as number)
      : null;

  let assinatura: (Venda & { plano: Plano | null }) | null = null;

  if (nrIdTelegram !== null) {
    const { data: vendasData } = await supabase.from("VENDAS").select("*");
    const { data: planosData } = await supabase.from("PLANOS").select("*");
    const vendas: Venda[] = vendasData ?? [];
    const planos: Plano[] = planosData ?? [];

    const ativa = vendas
      .filter(
        (v) =>
          v.nr_id_telegram === nrIdTelegram &&
          v.tp_compra === "ASSINATURA" &&
          v.tp_status === "APROVADA" &&
          !estaExpirada(v.ts_expiracao)
      )
      .sort(
        (a, b) =>
          new Date(b.ts_expiracao).getTime() -
          new Date(a.ts_expiracao).getTime()
      )[0];

    if (ativa) {
      assinatura = {
        ...ativa,
        plano: planos.find((p) => p.cd_plano === ativa.cd_plano) ?? null,
      };
    }
  }

  const diasRestantes = assinatura
    ? calcularDiasRestantes(assinatura.ts_expiracao)
    : 0;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar categorias={[]} />

      <section className="mx-auto w-full max-w-2xl px-4 pb-12 pt-28 sm:px-8">
        <h1 className="text-2xl font-black text-foreground sm:text-3xl">
          Minha Assinatura
        </h1>
        <p className="mt-1 text-sm text-secondary">{user.email}</p>

        {assinatura ? (
          <div className="mt-8 overflow-hidden rounded-lg border border-border bg-surface p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
                Assinatura ativa
              </span>
            </div>

            <h2 className="mt-3 text-xl font-black text-foreground sm:text-2xl">
              {assinatura.plano?.nm_plano ?? "Plano"}
            </h2>
            {assinatura.plano?.nm_categoria && (
              <p className="mt-1 text-sm text-secondary">
                Categoria: {assinatura.plano.nm_categoria}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-6">
              <div>
                <p className="text-xs uppercase tracking-wide text-secondary">
                  Renovação / expiração
                </p>
                <p className="text-base font-bold text-foreground">
                  {formatarData(assinatura.ts_expiracao)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-secondary">
                  Dias restantes
                </p>
                <p className="text-base font-bold text-primary">
                  {diasRestantes}
                </p>
              </div>
            </div>

            <Link
              href="/assinaturas"
              className="mt-8 inline-block rounded-md border border-secondary/40 px-6 py-3 text-sm font-bold text-foreground transition-colors hover:border-foreground"
            >
              Ver planos e trocar assinatura
            </Link>
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-border bg-surface p-8 text-center">
            <p className="text-lg font-bold text-foreground">
              Você ainda não tem uma assinatura ativa
            </p>
            <p className="mt-2 text-sm text-secondary">
              Assine agora e tenha acesso a todo o catálogo.
            </p>
            <Link
              href="/assinaturas"
              className="mt-6 inline-block rounded-md bg-primary px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
            >
              Ver planos
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
