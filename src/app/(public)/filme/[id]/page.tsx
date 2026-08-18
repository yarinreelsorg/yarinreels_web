import { notFound } from "next/navigation";
import FilmeContent from "@/components/filme/FilmeContent";
import { pool } from "@/lib/db";
import { getSessaoUsuario } from "@/lib/user-auth";
import { obterIdsFavoritos } from "@/lib/favoritos";
import type { Conteudo, Episodio } from "@/types/database";

export default async function FilmePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { rows: conteudos } = await pool.query<Conteudo>('SELECT * FROM "CONTEUDOS"');

  const conteudo = conteudos.find((c) => String(c.cd_conteudo) === id);
  if (!conteudo) notFound();

  // Incrementa visualizações em segundo plano
  pool.query('UPDATE "CONTEUDOS" SET nr_views = nr_views + 1 WHERE cd_conteudo = $1', [conteudo.cd_conteudo]).catch(() => {});

  const categorias = Array.from(
    new Set(conteudos.map((c) => c.nm_categoria).filter(Boolean))
  ).sort();

  const similares = conteudos
    .filter(
      (c) =>
        c.cd_conteudo !== conteudo.cd_conteudo &&
        c.nm_categoria === conteudo.nm_categoria
    )
    .sort((a, b) => b.nr_views - a.nr_views)
    .slice(0, 12);

  let episodios: Episodio[] = [];
  if (conteudo.tp_formato === "SERIE") {
    const { rows: todosEpisodios } = await pool.query<Episodio>('SELECT * FROM "EPISODIOS"');
    episodios = todosEpisodios
      .filter((e) => String(e.cd_conteudo) === id)
      .sort((a, b) => a.nr_episodio - b.nr_episodio);
  }

  const sessao = await getSessaoUsuario();
  const idsFavoritos = sessao ? await obterIdsFavoritos(sessao.cd_usuario) : new Set<string>();

  return (
    <FilmeContent
      conteudo={conteudo}
      episodios={episodios}
      similares={similares}
      categorias={categorias}
      favoritado={idsFavoritos.has(conteudo.cd_conteudo)}
      logado={!!sessao}
    />
  );
}
