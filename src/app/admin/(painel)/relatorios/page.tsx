import { carregarDadosRelatorios } from "./actions";
import RelatoriosAdminClient from "./RelatoriosAdminClient";

export const revalidate = 0;

export default async function RelatoriosPage() {
  const dados = await carregarDadosRelatorios({
    periodo: "hoje",
    status: "TODAS",
  });

  return (
    <RelatoriosAdminClient
      dadosIniciais={{
        metricas: dados.metricas,
        rankingConteudos: dados.rankingConteudos,
        origensTelegram: dados.origensTelegram,
        vendasTabela: dados.vendasTabela,
      }}
      listaOrigensIniciais={dados.listaOrigensDisponiveis}
    />
  );
}
