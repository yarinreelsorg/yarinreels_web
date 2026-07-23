import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?redirect_to=/checkout/conteudo/${id}?tipo=${tpCompra}`);

  const { data: conteudo } = await supabase
    .from("CONTEUDOS")
    .select("nm_titulo, vl_aluguel, vl_vitalicio")
    .eq("cd_conteudo", id)
    .maybeSingle();

  if (!conteudo) notFound();

  const valor = tpCompra === "ALUGUEL" ? conteudo.vl_aluguel : conteudo.vl_vitalicio;
  if (!valor) notFound();

  const taxaCartao = await obterTaxaCartao(supabase);

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
