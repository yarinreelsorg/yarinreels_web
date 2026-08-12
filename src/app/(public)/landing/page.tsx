import LandingContent from "@/components/landing/LandingContent";
import { pool } from "@/lib/db";
import type { Conteudo, Plano } from "@/types/database";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "YarinReels — Conheça a Plataforma de Streaming",
  description:
    "Assista aos melhores doramas asiáticos, séries e filmes em alta definição. Streaming sem travamentos, sem anúncios e integrado com o Telegram.",
};

export default async function LandingPage() {
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
