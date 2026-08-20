import { listarResumoAfiliados } from "@/lib/afiliados";
import AfiliadosAdminClient from "./AfiliadosAdminClient";

export const revalidate = 0;

export default async function AfiliadosAdminPage() {
  const afiliados = await listarResumoAfiliados();

  return <AfiliadosAdminClient afiliados={afiliados} />;
}
