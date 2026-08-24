import HomeContent from "@/components/home/HomeContent";
import { pool } from "@/lib/db";
import { deveExibirPromoInicial, obterCdPlanoPromoInicial } from "@/lib/pagamento";
import {
  canonicalizarCategorias,
  obterCategoriasExclusivasAssinantes,
  ordenarCategorias,
} from "@/lib/categorias-config";
import { getSessaoUsuario } from "@/lib/user-auth";
import {
  conteudoIncluidoEmCategorias,
  obterCategoriasAssinaturaAtiva,
  usuarioTemAssinaturaAtiva,
} from "@/lib/acesso";
import { obterContinuarAssistindo } from "@/lib/historico";
import { obterAppsVisiveis } from "@/lib/apps-config";
import type { Conteudo } from "@/types/database";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "YarinReels — Plataforma de Streaming de Doramas, Séries e Filmes",
  description:
    "Assista aos melhores doramas asiáticos, séries e filmes em alta definição. Streaming sem travamentos, sem anúncios e integrado com o Telegram.",
};

export default async function HomePage() {
  const sessao = await getSessaoUsuario();

  // Catálogo completo estilo Netflix pra todo mundo, logado ou não — login
  // só é pedido na hora de comprar/assistir (checkout/player já bloqueiam
  // isso). A landing de apresentação/vendas fica só em /landing e /lp,
  // usadas como destino de anúncio, não mais como página inicial.
  const { rows: conteudosSemExclusivos } = await pool.query<Conteudo>(
    'SELECT * FROM "CONTEUDOS" WHERE sn_exclusivo_assinantes = false'
  );
  const cdPlanoPromo = sessao ? await obterCdPlanoPromoInicial() : null;
  const continuarAssistindo = sessao ? await obterContinuarAssistindo(sessao.cd_usuario) : [];
  const exibirPromoInicial = sessao ? await deveExibirPromoInicial(sessao.cd_usuario) : true;
  const ehAssinante = sessao ? await usuarioTemAssinaturaAtiva(sessao.cd_usuario) : false;
  const categoriasAssinatura =
    sessao && ehAssinante ? await obterCategoriasAssinaturaAtiva(sessao.cd_usuario) : [];

  const categoriasExclusivas = await obterCategoriasExclusivasAssinantes();
  const canonPorNome = canonicalizarCategorias(
    conteudosSemExclusivos.map((c) => c.nm_categoria)
  );
  const conteudosCanonizados = conteudosSemExclusivos.map((c) => {
    const nm_categoria = canonPorNome.get(c.nm_categoria) ?? c.nm_categoria;
    return {
      ...c,
      nm_categoria,
      incluidoNaAssinatura: conteudoIncluidoEmCategorias(nm_categoria, categoriasAssinatura),
    };
  });
  const conteudos = ehAssinante
    ? conteudosCanonizados
    : conteudosCanonizados.filter((c) => !categoriasExclusivas.includes(c.nm_categoria));

  const categoriasSemOrdem = Array.from(
    new Set(conteudos.map((c) => c.nm_categoria).filter(Boolean))
  );
  const categorias = await ordenarCategorias(categoriasSemOrdem, ehAssinante);
  const apps = await obterAppsVisiveis();

  const destacados = conteudos.filter((c) => c.sn_destaque);
  const destaques =
    destacados.length > 0
      ? [...destacados]
          .sort((a, b) => (a.nr_ordem_destaque ?? 0) - (b.nr_ordem_destaque ?? 0))
          .slice(0, 5)
      : [...conteudos].sort((a, b) => b.nr_views - a.nr_views).slice(0, 5);

  const top12Manual = conteudos.filter((c) => c.sn_top12);
  const top12 =
    top12Manual.length > 0
      ? [...top12Manual]
          .sort((a, b) => (a.nr_ordem_top12 ?? 0) - (b.nr_ordem_top12 ?? 0))
          .slice(0, 12)
      : [...conteudos].sort((a, b) => b.nr_views - a.nr_views).slice(0, 12);

  return (
    <HomeContent
      conteudos={conteudos}
      categorias={categorias}
      apps={apps}
      destaques={destaques}
      top12={top12}
      cdPlanoPromo={cdPlanoPromo}
      continuarAssistindo={continuarAssistindo}
      exibirPromoInicial={exibirPromoInicial}
    />
  );
}
