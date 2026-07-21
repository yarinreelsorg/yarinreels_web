import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { categoriasCompativeis, obterIdsTelegramElegiveis } from "@/lib/acesso";
import Navbar from "@/components/layout/Navbar";
import CardFilme from "@/components/catalog/CardFilme";
import MeusFilmesSecao, { type ItemMeusFilmes } from "@/components/catalog/MeusFilmesSecao";
import { SecaoTitulo, EstadoVazio } from "@/components/catalog/SecaoTitulo";
import Reveal from "@/components/motion/Reveal";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";
import { diasRestantes, estaExpirada } from "@/lib/catalogo";
import type { Conteudo, Plano, TpCompra, Venda } from "@/types/database";

export const revalidate = 0;

const ROTULO_TIPO: Record<TpCompra, string> = {
  ALUGUEL: "Aluguel",
  VITALICIO: "Vitalício",
  ASSINATURA: "Assinatura",
};

export default async function MinhaListaPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect_to=/minha-lista");

  const [{ data: favoritos }, ids] = await Promise.all([
    supabase
      .from("LISTA_FAVORITOS")
      .select("cd_conteudo, ts_criacao")
      .eq("cd_usuario_auth", user.id)
      .order("ts_criacao", { ascending: false }),
    obterIdsTelegramElegiveis(user),
  ]);

  const { data: vendasData } = await supabase
    .from("VENDAS")
    .select("*")
    .in("nr_id_telegram", ids)
    .eq("tp_status", "APROVADA")
    .order("ts_criacao", { ascending: false });

  const vendas: Venda[] = vendasData ?? [];

  const idsFavoritos = (favoritos ?? []).map((f) => f.cd_conteudo);
  const cdConteudosVendas = Array.from(
    new Set(vendas.map((v) => v.cd_conteudo).filter((id): id is string => !!id))
  );
  const cdPlanos = Array.from(
    new Set(vendas.map((v) => v.cd_plano).filter((id): id is string => !!id))
  );

  const idsParaBuscar = Array.from(new Set([...idsFavoritos, ...cdConteudosVendas]));

  const [{ data: conteudosData }, { data: planosData }] = await Promise.all([
    idsParaBuscar.length > 0
      ? supabase.from("CONTEUDOS").select("*").in("cd_conteudo", idsParaBuscar)
      : Promise.resolve({ data: [] as Conteudo[] }),
    cdPlanos.length > 0
      ? supabase.from("PLANOS").select("*").in("cd_plano", cdPlanos)
      : Promise.resolve({ data: [] as Plano[] }),
  ]);

  const conteudosMap = new Map((conteudosData ?? []).map((c) => [c.cd_conteudo, c]));
  const planosMap = new Map((planosData ?? []).map((p) => [p.cd_plano, p]));

  const favoritosConteudos = idsFavoritos
    .map((id) => conteudosMap.get(id))
    .filter((c): c is Conteudo => !!c);

  const vendasConteudo = vendas.filter(
    (v) => (v.tp_compra === "ALUGUEL" || v.tp_compra === "VITALICIO") && v.cd_conteudo
  );
  const assinaturas = vendas.filter((v) => v.tp_compra === "ASSINATURA");
  const assinaturaAtiva = assinaturas.find((v) => v.ts_expiracao && !estaExpirada(v.ts_expiracao));

  const ativos = vendasConteudo.filter((v) => v.ts_expiracao && !estaExpirada(v.ts_expiracao));
  const expirados = vendasConteudo.filter((v) => !v.ts_expiracao || estaExpirada(v.ts_expiracao));

  // Assinatura libera uma categoria inteira, não só o que tem venda avulsa —
  // então busca os conteúdos dessa categoria pra mostrar aqui também.
  let liberadosPorAssinatura: Conteudo[] = [];
  let planoAtivo: Plano | undefined;
  if (assinaturaAtiva) {
    planoAtivo = planosMap.get(assinaturaAtiva.cd_plano ?? "");
    if (planoAtivo) {
      const { data: todosConteudos } = await supabase.from("CONTEUDOS").select("*");
      const idsAtivosAvulsos = new Set(ativos.map((v) => v.cd_conteudo));
      liberadosPorAssinatura = (todosConteudos ?? []).filter(
        (c) =>
          !idsAtivosAvulsos.has(c.cd_conteudo) &&
          categoriasCompativeis(planoAtivo!.nm_categoria, c.nm_categoria)
      );
    }
  }

  const itensMeusFilmes: ItemMeusFilmes[] = [
    ...ativos.flatMap((venda) => {
      const conteudo = conteudosMap.get(venda.cd_conteudo as string);
      if (!conteudo) return [];
      const dias = diasRestantes(venda.ts_expiracao as string);
      return [
        {
          conteudo,
          grupo: "ativo" as const,
          href: `/assistir/${conteudo.cd_conteudo}`,
          badge: ROTULO_TIPO[venda.tp_compra],
          legenda:
            venda.tp_compra === "VITALICIO"
              ? "Acesso vitalício"
              : `${dias} dia${dias === 1 ? "" : "s"} restante${dias === 1 ? "" : "s"}`,
        },
      ];
    }),
    ...liberadosPorAssinatura.map((conteudo) => ({
      conteudo,
      grupo: "assinatura" as const,
    })),
    ...expirados.flatMap((venda) => {
      const conteudo = conteudosMap.get(venda.cd_conteudo as string);
      if (!conteudo) return [];
      return [
        {
          conteudo,
          grupo: "expirado" as const,
          badge: "Expirado",
          legenda: "Comprar de novo",
        },
      ];
    }),
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar categorias={[]} />

      <div className="px-4 pb-20 pt-24 sm:px-8">
        {/* Cabeçalho */}
        <Reveal>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Minha Lista
          </h1>
          <p className="mt-2 max-w-xl text-sm text-secondary">
            Seus filmes comprados, o que sua assinatura libera, e o que você salvou pra ver depois.
          </p>
        </Reveal>

        {/* Assinatura ativa */}
        {assinaturaAtiva && planoAtivo && (
          <Reveal delay={0.05} className="mt-8">
            <div
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg p-5 sm:p-6"
              style={{
                background: "linear-gradient(120deg, rgba(123,47,190,0.18), rgba(13,10,26,0.4))",
                border: "1px solid rgba(139,92,246,0.3)",
              }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    Assinatura ativa
                  </span>
                </div>
                <p className="mt-1.5 text-xl font-black text-foreground">{planoAtivo.nm_plano}</p>
                <p className="mt-0.5 text-sm text-secondary">
                  Libera <span className="font-semibold text-[#A78BFA]">{planoAtivo.nm_categoria}</span>{" "}
                  · vale até{" "}
                  {new Intl.DateTimeFormat("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  }).format(new Date(assinaturaAtiva.ts_expiracao as string))}
                </p>
              </div>
              <Link
                href="/conta/assinatura"
                className="shrink-0 rounded-md border border-primary/40 px-4 py-2 text-xs font-bold text-foreground transition-colors hover:border-primary"
              >
                Gerenciar
              </Link>
            </div>
          </Reveal>
        )}

        {/* Meus Filmes (comprados) */}
        <Reveal delay={0.1} className="mt-12">
          <MeusFilmesSecao itens={itensMeusFilmes} />
        </Reveal>

        {/* Favoritos */}
        <Reveal delay={0.05} className="mt-14">
          <SecaoTitulo>Salvos pra Depois</SecaoTitulo>

          {favoritosConteudos.length === 0 ? (
            <EstadoVazio texto="Sua lista de salvos está vazia." />
          ) : (
            <StaggerGroup
              className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
              staggerChildren={0.04}
            >
              {favoritosConteudos.map((conteudo) => (
                <StaggerItem key={conteudo.cd_conteudo}>
                  <CardFilme conteudo={conteudo} variant="grid" />
                </StaggerItem>
              ))}
            </StaggerGroup>
          )}
        </Reveal>
      </div>
    </div>
  );
}
