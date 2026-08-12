import { buscarRadarOnline } from "./actions";
import OnlineAdminClient from "./OnlineAdminClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OnlinePage() {
  const dados = await buscarRadarOnline();

  return <OnlineAdminClient dadosIniciais={dados} />;
}
