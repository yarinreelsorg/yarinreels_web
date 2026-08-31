import { notFound } from "next/navigation";
import { pool } from "@/lib/db";
import { getSessaoUsuario } from "@/lib/user-auth";
import TrailerContent from "./TrailerContent";
import type { Conteudo } from "@/types/database";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { rows } = await pool.query<Pick<Conteudo, "nm_titulo" | "ds_descricao" | "ds_url_poster">>(
    'SELECT nm_titulo, ds_descricao, ds_url_poster FROM "CONTEUDOS" WHERE cd_conteudo = $1',
    [id]
  );
  const conteudo = rows[0];
  if (!conteudo) return {};

  return {
    title: `${conteudo.nm_titulo} — YarinReels`,
    description: conteudo.ds_descricao ?? undefined,
    openGraph: conteudo.ds_url_poster ? { images: [conteudo.ds_url_poster] } : undefined,
  };
}

/**
 * Página de destino pra tráfego de anúncio no celular: experiência
 * imersiva estilo TikTok/Reels (tela cheia vertical), separada do layout
 * padrão do site — sem Navbar/BottomNav normais, só o próprio player.
 */
export default async function TrailerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { rows } = await pool.query<Conteudo>('SELECT * FROM "CONTEUDOS" WHERE cd_conteudo = $1', [
    id,
  ]);
  const conteudo = rows[0];

  // Sem clipe vertical cadastrado, não tem o que mostrar nessa tela —
  // volta pra página normal de detalhes em vez de uma tela quebrada.
  if (!conteudo || !conteudo.ds_url_teaser_vertical) notFound();

  pool
    .query('UPDATE "CONTEUDOS" SET nr_views = nr_views + 1 WHERE cd_conteudo = $1', [
      conteudo.cd_conteudo,
    ])
    .catch(() => {});

  const tags = (conteudo.ds_generos ?? conteudo.nm_categoria)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 3);

  const sessao = await getSessaoUsuario();

  return <TrailerContent conteudo={conteudo} tags={tags} logado={!!sessao} />;
}
