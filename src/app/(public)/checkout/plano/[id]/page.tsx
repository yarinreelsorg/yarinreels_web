import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { pool } from "@/lib/db";
import { getSessaoUsuario } from "@/lib/user-auth";
import { obterTaxaCartao } from "@/lib/pagamento";
import Navbar from "@/components/layout/Navbar";
import { MetodoPagamentoPlano } from "@/components/checkout/MetodoPagamento";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CheckoutPlanoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const sessao = await getSessaoUsuario();
  if (!sessao) redirect(`/login?redirect_to=/checkout/plano/${id}`);

  const { rows } = await pool.query<{ nm_plano: string; vl_plano: number }>(
    'SELECT nm_plano, vl_plano FROM "PLANOS" WHERE cd_plano = $1 LIMIT 1',
    [id]
  );
  const plano = rows[0];

  if (!plano) notFound();

  const taxaCartao = await obterTaxaCartao();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar categorias={[]} />

      <section className="mx-auto w-full max-w-md px-4 pb-16 pt-6 sm:px-8">
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
