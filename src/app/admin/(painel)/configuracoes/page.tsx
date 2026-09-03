import { pool } from "@/lib/db";
import { getSessaoAdmin } from "@/lib/admin-auth";
import { obterTaxaCartao } from "@/lib/pagamento";
import { canonicalizarCategorias, ordenarCategoriasParaAdmin } from "@/lib/categorias-config";
import {
  obterCarenciaAssinanteHoras,
  obterLogoSite,
  obterPercentualAfiliado,
  obterVideoSuporteSite,
} from "@/lib/site-config";
import type { Administrador, Conteudo } from "@/types/database";
import ConfiguracoesClient from "./ConfiguracoesClient";

export const revalidate = 0;

export default async function ConfiguracoesPage() {
  const [
    sessao,
    { rows: administradores },
    taxaCartao,
    { rows: conteudos },
    logoAtual,
    carenciaHoras,
    videoSuporte,
    percentualAfiliado,
  ] = await Promise.all([
    getSessaoAdmin(),
    pool.query<Administrador>('SELECT * FROM "ADMINISTRADORES" ORDER BY ts_criacao ASC'),
    obterTaxaCartao(),
    pool.query<Pick<Conteudo, "nm_categoria">>('SELECT DISTINCT nm_categoria FROM "CONTEUDOS"'),
    obterLogoSite(),
    obterCarenciaAssinanteHoras(),
    obterVideoSuporteSite(),
    obterPercentualAfiliado(),
  ]);

  // Categorias divergindo só por maiúscula/minúscula/acento (ex: "Brasileira"
  // vs "BRASILEIRA") viravam duas linhas separadas nessa tela — agrupa antes
  // de montar a lista, igual já acontecia na home/catálogo.
  const nomesCategorias = conteudos.map((c) => c.nm_categoria).filter(Boolean);
  const canonPorNome = canonicalizarCategorias(nomesCategorias);
  const categoriasSemOrdem = Array.from(new Set(nomesCategorias.map((c) => canonPorNome.get(c) ?? c)));
  const categoriasOrdenadas = await ordenarCategoriasParaAdmin(categoriasSemOrdem);

  return (
    <ConfiguracoesClient
      administradores={administradores}
      cdAdministradorAtual={sessao?.cd_administrador ?? null}
      papelAtual={sessao?.tp_papel ?? "ADMIN"}
      taxaCartaoInicial={taxaCartao}
      categoriasOrdenadas={categoriasOrdenadas}
      logoAtual={logoAtual}
      carenciaHorasInicial={carenciaHoras}
      videoSuporteInicial={videoSuporte ?? ""}
      percentualAfiliadoInicial={percentualAfiliado}
    />
  );
}
