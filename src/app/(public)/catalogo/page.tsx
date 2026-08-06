import CatalogoContent from "@/components/catalogo/CatalogoContent";
import { pool } from "@/lib/db";
import { ordenarCategorias } from "@/lib/categorias-config";
import type { Conteudo, TpFormato } from "@/types/database";

const FORMATOS_VALIDOS: TpFormato[] = ["FILME", "SERIE", "DOCUMENTARIO", "AULA"];

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const { rows: conteudos } = await pool.query<Conteudo>('SELECT * FROM "CONTEUDOS"');

  const categoriasSemOrdem = Array.from(
    new Set(conteudos.map((c) => c.nm_categoria).filter(Boolean))
  );
  const categorias = await ordenarCategorias(categoriasSemOrdem);

  const apps = Array.from(
    new Set(conteudos.map((c) => c.nm_app_origem).filter((a): a is string => Boolean(a)))
  ).sort();

  const formatoParam =
    typeof params.formato === "string" ? params.formato.toUpperCase() : null;
  const formatoInicial =
    formatoParam && FORMATOS_VALIDOS.includes(formatoParam as TpFormato)
      ? (formatoParam as TpFormato)
      : null;

  const categoriaParam =
    typeof params.categoria === "string" ? params.categoria : null;
  const categoriaInicial =
    categoriaParam && categorias.includes(categoriaParam) ? categoriaParam : null;

  const buscaInicial = typeof params.busca === "string" ? params.busca : "";

  const appParam = typeof params.app === "string" ? params.app : null;
  const appInicial = appParam && apps.includes(appParam) ? appParam : null;

  return (
    <CatalogoContent
      conteudos={conteudos}
      categorias={categorias}
      apps={apps}
      formatoInicial={formatoInicial}
      categoriaInicial={categoriaInicial}
      appInicial={appInicial}
      buscaInicial={buscaInicial}
    />
  );
}
