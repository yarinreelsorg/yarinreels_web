import { notFound } from "next/navigation";
import UniversoPage from "./UniversoPage";
import { pool } from "@/lib/db";
import { UNIVERSOS_CONFIG, categoriaParaSlug, COR_UNIVERSO_PADRAO } from "@/lib/universos-config";
import { otimizarUrlPoster } from "@/lib/catalogo";
import type { Conteudo } from "@/types/database";

export default async function UniversoRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: slugParam } = await params;
  // Alguns caracteres (ex: "+" em "+18") chegam sem decodificar do roteador.
  let slug = slugParam;
  try {
    slug = decodeURIComponent(slugParam);
  } catch {
    // slug já decodificado ou malformado — usa como veio
  }

  const { rows: categoriaRows } = await pool.query<Pick<Conteudo, "nm_categoria">>(
    'SELECT nm_categoria FROM "CONTEUDOS"'
  );

  const categorias = Array.from(
    new Set(categoriaRows.map((c) => c.nm_categoria).filter(Boolean))
  );

  const nmCategoria = categorias.find((c) => categoriaParaSlug(c) === slug);

  if (!nmCategoria) {
    notFound();
  }

  const termo = nmCategoria.replace(/[%_]/g, "");

  const { rows: conteudosUniverso } = await pool.query<Conteudo>(
    `SELECT * FROM "CONTEUDOS" WHERE nm_categoria ILIKE $1 OR ds_generos ILIKE $1 ORDER BY nr_views DESC`,
    [`%${termo}%`]
  );

  const config = UNIVERSOS_CONFIG[slug];
  const label = config?.label ?? nmCategoria;
  const cor = config?.cor ?? COR_UNIVERSO_PADRAO;
  const bannerUrl = otimizarUrlPoster(
    config?.imagemUrl ?? conteudosUniverso[0]?.ds_url_poster ?? null,
    900
  );

  return (
    <UniversoPage
      label={label}
      cor={cor}
      bannerUrl={bannerUrl}
      conteudos={conteudosUniverso}
    />
  );
}
