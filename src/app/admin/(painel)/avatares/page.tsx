import { listarAvataresAdmin } from "./actions";
import AvataresAdminClient from "./AvataresAdminClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AvataresPage() {
  const avatares = await listarAvataresAdmin();

  return <AvataresAdminClient avataresIniciais={avatares} />;
}
