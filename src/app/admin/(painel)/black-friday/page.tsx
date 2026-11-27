import { obterEstadoBlackFriday } from "@/lib/black-friday";
import BlackFridayAdminClient from "./BlackFridayAdminClient";

export const revalidate = 0;

export default async function BlackFridayAdminPage() {
  const estado = await obterEstadoBlackFriday();

  return <BlackFridayAdminClient estadoInicial={estado} />;
}
