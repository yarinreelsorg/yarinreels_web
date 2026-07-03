import CatalogoContent from "@/components/catalogo/CatalogoContent";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Conteudo, TpFormato } from "@/types/database";

const FORMATOS_VALIDOS: TpFormato[] = ["FILME", "SERIE", "DOCUMENTARIO", "AULA"];

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase.from("CONTEUDOS").select("*");
  const conteudos: Conteudo[] = data ?? [];

  const categorias = Array.from(
    new Set(conteudos.map((c) => c.nm_categoria).filter(Boolean))
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

  return (
    <CatalogoContent
      conteudos={conteudos}
      categorias={categorias}
      formatoInicial={formatoInicial}
      categoriaInicial={categoriaInicial}
      buscaInicial={buscaInicial}
    />
  );
}
