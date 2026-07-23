import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { obterTaxaCartao } from "@/lib/pagamento";
import Navbar from "@/components/layout/Navbar";
import { MetodoPagamentoPlano } from "@/components/checkout/MetodoPagamento";

export default async function CheckoutPlanoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?redirect_to=/checkout/plano/${id}`);

  const { data: plano } = await supabase
    .from("PLANOS")
    .select("nm_plano, vl_plano")
    .eq("cd_plano", id)
    .maybeSingle();

  if (!plano) notFound();

  const taxaCartao = await obterTaxaCartao(supabase);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar categorias={[]} />

      <section className="mx-auto w-full max-w-md px-4 pb-16 pt-28 sm:px-8">
        <Link href="/assinaturas" className="mb-6 inline-block text-sm text-secondary hover:text-foreground">
          ← Voltar
        </Link>

        <MetodoPagamentoPlano
          cdPlano={id}
          titulo={plano.nm_plano}
          valor={plano.vl_plano}
          taxaCartao={taxaCartao}
        />
      </section>
    </div>
  );
}
