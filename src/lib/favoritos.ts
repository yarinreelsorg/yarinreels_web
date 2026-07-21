import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/types";

export async function obterIdsFavoritos(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Set<string>> {
  const { data } = await supabase
    .from("LISTA_FAVORITOS")
    .select("cd_conteudo")
    .eq("cd_usuario_auth", userId);

  return new Set((data ?? []).map((f) => f.cd_conteudo));
}
