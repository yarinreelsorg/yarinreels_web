import { listarSolicitacoesAgrupadas } from "./actions";
import SolicitacoesAdminClient from "./SolicitacoesAdminClient";

export const revalidate = 0;

export default async function SolicitacoesAdminPage() {
  const solicitacoes = await listarSolicitacoesAgrupadas();

  return <SolicitacoesAdminClient solicitacoesIniciais={solicitacoes} />;
}
