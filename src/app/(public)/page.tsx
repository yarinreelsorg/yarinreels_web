import HomeContent from "@/components/home/HomeContent";
import { pool } from "@/lib/db";
import { getSessaoUsuario } from "@/lib/user-auth";
import { obterIdsFavoritos } from "@/lib/favoritos";
import type { Conteudo } from "@/types/database";

export default async function HomePage() {
  const { rows: conteudos } = await pool.query<Conteudo>('SELECT * FROM "CONTEUDOS"');

  const sessao = await getSessaoUsuario();
  const idsFavoritos = sessao ? await obterIdsFavoritos(sessao.cd_usuario) : new Set<string>();

  const categorias = Array.from(
    new Set(conteudos.map((c) => c.nm_categoria).filter(Boolean))
  ).sort();

  const destacados = conteudos.filter((c) => c.sn_destaque);
  const destaques = (destacados.length > 0 ? destacados : conteudos)
    .slice()
    .sort((a, b) => b.nr_views - a.nr_views)
    .slice(0, 5);

  const top12 = [...conteudos]
    .sort((a, b) => b.nr_views - a.nr_views)
    .slice(0, 12);

  return (
    <HomeContent
      conteudos={conteudos}
      categorias={categorias}
      destaques={destaques}
      top12={top12}
      favoritosIds={Array.from(idsFavoritos)}
      logado={!!sessao}
    />
  );
}
