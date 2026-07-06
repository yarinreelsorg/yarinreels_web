import { notFound } from "next/navigation";
import UniversoPage from "./UniversoPage";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UNIVERSOS_CONFIG, categoriaParaSlug, COR_UNIVERSO_PADRAO } from "@/lib/universos-config";
import type { Conteudo } from "@/types/database";

export default async function UniversoRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: categoriaRows } = await supabase
    .from("CONTEUDOS")
    .select("nm_categoria");

  const linhas: Pick<Conteudo, "nm_categoria">[] = categoriaRows ?? [];
  const categorias = Array.from(
    new Set(linhas.map((c) => c.nm_categoria).filter(Boolean))
  );

  const nmCategoria = categorias.find((c) => categoriaParaSlug(c) === slug);

  if (!nmCategoria) {
    notFound();
  }

  const termo = nmCategoria.replace(/[%_]/g, "");

  const { data } = await supabase
    .from("CONTEUDOS")
    .select("*")
    .or(`nm_categoria.ilike.%${termo}%,ds_generos.ilike.%${termo}%`)
    .order("nr_views", { ascending: false });

  const conteudosUniverso: Conteudo[] = data ?? [];

  const config = UNIVERSOS_CONFIG[slug];
  const label = config?.label ?? nmCategoria;
  const cor = config?.cor ?? COR_UNIVERSO_PADRAO;
  const bannerUrl = config?.imagemUrl ?? conteudosUniverso[0]?.ds_url_poster ?? null;

  return (
    <UniversoPage
      label={label}
      cor={cor}
      bannerUrl={bannerUrl}
      conteudos={conteudosUniverso}
    />
  );
}
