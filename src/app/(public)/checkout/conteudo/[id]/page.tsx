import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { pool } from "@/lib/db";
import { getSessaoUsuario } from "@/lib/user-auth";
import { obterTaxaCartao } from "@/lib/pagamento";
import Navbar from "@/components/layout/Navbar";
import { MetodoPagamentoConteudo } from "@/components/checkout/MetodoPagamento";

export default async function CheckoutConteudoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { id } = await params;
  const { tipo } = await searchParams;

  const tpCompra = tipo === "VITALICIO" ? "VITALICIO" : "ALUGUEL";

  const sessao = await getSessaoUsuario();
  if (!sessao) redirect(`/login?redirect_to=/checkout/conteudo/${id}?tipo=${tpCompra}`);

  const { rows } = await pool.query<{
    nm_titulo: string;
    vl_aluguel: number | null;
    vl_vitalicio: number | null;
  }>('SELECT nm_titulo, vl_aluguel, vl_vitalicio FROM "CONTEUDOS" WHERE cd_conteudo = $1 LIMIT 1', [
    id,
  ]);
  const conteudo = rows[0];

  if (!conteudo) notFound();

  const valor = tpCompra === "ALUGUEL" ? conteudo.vl_aluguel : conteudo.vl_vitalicio;
  if (!valor) notFound();

  const taxaCartao = await obterTaxaCartao();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar categorias={[]} />

      <section className="mx-auto w-full max-w-md px-4 pb-16 pt-28 sm:px-8">
        <Link href={`/filme/${id}`} className="mb-6 inline-block text-sm text-secondary hover:text-foreground">
          ← Voltar
        </Link>

        <MetodoPagamentoConteudo
          cdConteudo={id}
          tipo={tpCompra}
          titulo={conteudo.nm_titulo}
          valor={valor}
          taxaCartao={taxaCartao}
        />
      </section>
    </div>
  );
}
