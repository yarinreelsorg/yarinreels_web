"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function alternarFavorito(cd_conteudo: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Você precisa estar logado.");

  const { data: existente } = await supabase
    .from("LISTA_FAVORITOS")
    .select("cd_favorito")
    .eq("cd_usuario_auth", user.id)
    .eq("cd_conteudo", cd_conteudo)
    .maybeSingle();

  if (existente) {
    const { error } = await supabase
      .from("LISTA_FAVORITOS")
      .delete()
      .eq("cd_favorito", existente.cd_favorito);
    if (error) throw new Error(error.message);
    revalidatePath("/minha-lista");
    return { favoritado: false };
  }

  const { error } = await supabase
    .from("LISTA_FAVORITOS")
    .insert({ cd_usuario_auth: user.id, cd_conteudo });
  if (error) throw new Error(error.message);
  revalidatePath("/minha-lista");
  return { favoritado: true };
}
