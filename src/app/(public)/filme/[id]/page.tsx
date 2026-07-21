import { notFound } from "next/navigation";
import FilmeContent from "@/components/filme/FilmeContent";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { obterIdsFavoritos } from "@/lib/favoritos";
import type { Conteudo, Episodio } from "@/types/database";

export default async function FilmePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();

  const { data: todos } = await supabase.from("CONTEUDOS").select("*");
  const conteudos: Conteudo[] = todos ?? [];

  const conteudo = conteudos.find((c) => String(c.cd_conteudo) === id);
  if (!conteudo) notFound();

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
    const { data } = await supabase.from("EPISODIOS").select("*");
    const todosEpisodios: Episodio[] = data ?? [];
    episodios = todosEpisodios
      .filter((e) => String(e.cd_conteudo) === id)
      .sort((a, b) => a.nr_episodio - b.nr_episodio);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const idsFavoritos = user ? await obterIdsFavoritos(supabase, user.id) : new Set<string>();

  return (
    <FilmeContent
      conteudo={conteudo}
      episodios={episodios}
      similares={similares}
      categorias={categorias}
      favoritado={idsFavoritos.has(conteudo.cd_conteudo)}
      logado={!!user}
    />
  );
}
