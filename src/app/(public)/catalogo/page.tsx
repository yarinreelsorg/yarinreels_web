import CatalogoContent from "@/components/catalogo/CatalogoContent";
import { pool } from "@/lib/db";
import {
  canonicalizarCategorias,
  obterCategoriasExclusivasAssinantes,
  ordenarCategorias,
} from "@/lib/categorias-config";
import { obterAppsVisiveis } from "@/lib/apps-config";
import { getSessaoUsuario } from "@/lib/user-auth";
import { usuarioTemAssinaturaAtiva } from "@/lib/acesso";
import type { Conteudo, TpFormato } from "@/types/database";

const FORMATOS_VALIDOS: TpFormato[] = ["FILME", "SERIE", "DOCUMENTARIO", "AULA"];

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const sessao = await getSessaoUsuario();
  const ehAssinante = sessao ? await usuarioTemAssinaturaAtiva(sessao.cd_usuario) : false;

  // Conteúdo exclusivo (individual ou de categoria inteira) pra assinantes
  // só aparece no catálogo/busca pra quem já assina — pra quem não assina,
  // é como se não existisse.
  const categoriasExclusivas = await obterCategoriasExclusivasAssinantes();
  const { rows: todosConteudos } = await pool.query<Conteudo>('SELECT * FROM "CONTEUDOS"');
  const canonPorNome = canonicalizarCategorias(todosConteudos.map((c) => c.nm_categoria));
  const todosConteudosCanonizados = todosConteudos.map((c) => ({
    ...c,
    nm_categoria: canonPorNome.get(c.nm_categoria) ?? c.nm_categoria,
  }));
  const conteudos = ehAssinante
    ? todosConteudosCanonizados
    : todosConteudosCanonizados.filter(
        (c) => !c.sn_exclusivo_assinantes && !categoriasExclusivas.includes(c.nm_categoria)
      );

  const categoriasSemOrdem = Array.from(
    new Set(conteudos.map((c) => c.nm_categoria).filter(Boolean))
  );
  const categorias = await ordenarCategorias(categoriasSemOrdem, ehAssinante);

  const apps = (await obterAppsVisiveis()).map((a) => a.nm_app);

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
