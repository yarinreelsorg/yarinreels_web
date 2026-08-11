import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { pool } from "@/lib/db";
import { getSessaoUsuario } from "@/lib/user-auth";
import { obterTaxaCartao } from "@/lib/pagamento";
import Navbar from "@/components/layout/Navbar";
import { MetodoPagamentoConteudo } from "@/components/checkout/MetodoPagamento";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CheckoutConteudoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { id } = await params;
  const { tipo } = await searchParams;

  const sessao = await getSessaoUsuario();

  const { rows } = await pool.query<{
    nm_titulo: string;
    vl_aluguel: number | null;
    vl_vitalicio: number | null;
  }>('SELECT nm_titulo, vl_aluguel, vl_vitalicio FROM "CONTEUDOS" WHERE cd_conteudo = $1 LIMIT 1', [
    id,
  ]);
  const conteudo = rows[0];

  if (!conteudo) notFound();

  const temAluguel = typeof conteudo.vl_aluguel === "number" && conteudo.vl_aluguel > 0;
  const temVitalicio = typeof conteudo.vl_vitalicio === "number" && conteudo.vl_vitalicio > 0;

  let tpCompra: "ALUGUEL" | "VITALICIO" = tipo === "VITALICIO" ? "VITALICIO" : "ALUGUEL";
  if (tpCompra === "ALUGUEL" && !temAluguel && temVitalicio) {
    tpCompra = "VITALICIO";
  }

  if (!sessao) redirect(`/login?redirect_to=/checkout/conteudo/${id}?tipo=${tpCompra}`);

  const valor = tpCompra === "ALUGUEL" ? conteudo.vl_aluguel : conteudo.vl_vitalicio;
  if (!valor || valor <= 0) notFound();

  const taxaCartao = await obterTaxaCartao();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar categorias={[]} />

      <section className="mx-auto w-full max-w-md px-4 pb-16 pt-6 sm:px-8">
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
