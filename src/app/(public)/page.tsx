import HomeContent from "@/components/home/HomeContent";
import { pool } from "@/lib/db";
import { deveExibirPromoInicial, obterCdPlanoPromoInicial } from "@/lib/pagamento";
import { ordenarCategorias } from "@/lib/categorias-config";
import { getSessaoUsuario } from "@/lib/user-auth";
import { obterContinuarAssistindo } from "@/lib/historico";
import { obterAppsVisiveis } from "@/lib/apps-config";
import type { Conteudo } from "@/types/database";

export default async function HomePage() {
  // sn_exclusivo_assinantes nunca aparece na home, nem pra quem assina —
  // a ideia é não poluir a tela inicial, não é uma trava de acesso.
  const { rows: conteudos } = await pool.query<Conteudo>(
    'SELECT * FROM "CONTEUDOS" WHERE sn_exclusivo_assinantes = false'
  );
  const cdPlanoPromo = await obterCdPlanoPromoInicial();

  const sessao = await getSessaoUsuario();
  const continuarAssistindo = sessao ? await obterContinuarAssistindo(sessao.cd_usuario) : [];
  const exibirPromoInicial = sessao ? await deveExibirPromoInicial(sessao.cd_usuario) : true;

  const categoriasSemOrdem = Array.from(
    new Set(conteudos.map((c) => c.nm_categoria).filter(Boolean))
  );
  const categorias = await ordenarCategorias(categoriasSemOrdem);

  const apps = await obterAppsVisiveis();

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
      apps={apps}
      destaques={destaques}
      top12={top12}
      cdPlanoPromo={cdPlanoPromo}
      continuarAssistindo={continuarAssistindo}
      exibirPromoInicial={exibirPromoInicial}
    />
  );
}
