import HomeContent from "@/components/home/HomeContent";
import LandingContent from "@/components/landing/LandingContent";
import { pool } from "@/lib/db";
import { deveExibirPromoInicial, obterCdPlanoPromoInicial } from "@/lib/pagamento";
import {
  canonicalizarCategorias,
  obterCategoriasExclusivasAssinantes,
  ordenarCategorias,
} from "@/lib/categorias-config";
import { getSessaoUsuario } from "@/lib/user-auth";
import { usuarioTemAssinaturaAtiva } from "@/lib/acesso";
import { obterContinuarAssistindo } from "@/lib/historico";
import { obterAppsVisiveis } from "@/lib/apps-config";
import type { Conteudo, Plano } from "@/types/database";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "YarinReels — Plataforma de Streaming de Doramas, Séries e Filmes",
  description:
    "Assista aos melhores doramas asiáticos, séries e filmes em alta definição. Streaming sem travamentos, sem anúncios e integrado com o Telegram.",
};

export default async function HomePage() {
  const sessao = await getSessaoUsuario();

  // 1. Usuário NÃO LOGADO: Exibe a Landing Page de Apresentação & Vendas
  if (!sessao) {
    const { rows: destaquesBuscados } = await pool.query<Conteudo>(
      'SELECT * FROM "CONTEUDOS" WHERE sn_destaque = true ORDER BY nr_ordem_destaque ASC, nr_views DESC LIMIT 12'
    );
    const { rows: maisVistos } = await pool.query<Conteudo>(
      'SELECT * FROM "CONTEUDOS" ORDER BY nr_views DESC LIMIT 12'
    );

    const destaques = destaquesBuscados.length > 0 ? destaquesBuscados : maisVistos.slice(0, 6);

    const { rows: doramasBuscados } = await pool.query<Conteudo>(
      `SELECT * FROM "CONTEUDOS" 
       WHERE LOWER(nm_categoria) LIKE '%dorama%' 
          OR LOWER(nm_categoria) LIKE '%asiatica%' 
          OR LOWER(ds_generos) LIKE '%dorama%' 
       ORDER BY nr_views DESC LIMIT 12`
    );
    const doramas = doramasBuscados.length > 0 ? doramasBuscados : maisVistos;

    const { rows: planos } = await pool.query<Plano>(
      'SELECT * FROM "PLANOS" ORDER BY vl_plano ASC'
    );

    const { rows: countRows } = await pool.query<{ total: number }>(
      'SELECT count(*)::int AS total FROM "CONTEUDOS"'
    );
    const { rows: viewsRows } = await pool.query<{ total_views: number }>(
      'SELECT COALESCE(sum(nr_views), 0)::int AS total_views FROM "CONTEUDOS"'
    );
    const { rows: catRows } = await pool.query<{ total_categorias: number }>(
      'SELECT count(DISTINCT nm_categoria)::int AS total_categorias FROM "CONTEUDOS"'
    );

    const estatisticas = {
      totalConteudos: countRows[0]?.total || 0,
      totalViews: viewsRows[0]?.total_views || 0,
      totalCategorias: catRows[0]?.total_categorias || 0,
    };

    return (
      <LandingContent
        destaques={destaques}
        maisVistos={maisVistos}
        doramas={doramas}
        planos={planos}
        estatisticas={estatisticas}
      />
    );
  }

  // 2. Usuário LOGADO: Vai direto para o catálogo completo estilo Netflix
  const { rows: conteudosSemExclusivos } = await pool.query<Conteudo>(
    'SELECT * FROM "CONTEUDOS" WHERE sn_exclusivo_assinantes = false'
  );
  const cdPlanoPromo = await obterCdPlanoPromoInicial();
  const continuarAssistindo = await obterContinuarAssistindo(sessao.cd_usuario);
  const exibirPromoInicial = await deveExibirPromoInicial(sessao.cd_usuario);
  const ehAssinante = await usuarioTemAssinaturaAtiva(sessao.cd_usuario);

  const categoriasExclusivas = await obterCategoriasExclusivasAssinantes();
  const canonPorNome = canonicalizarCategorias(
    conteudosSemExclusivos.map((c) => c.nm_categoria)
  );
  const conteudosCanonizados = conteudosSemExclusivos.map((c) => ({
    ...c,
    nm_categoria: canonPorNome.get(c.nm_categoria) ?? c.nm_categoria,
  }));
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
