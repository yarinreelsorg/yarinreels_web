import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { obterIdsTelegramElegiveis, verificarAcessoConteudo, type StatusAcesso } from "@/lib/acesso";
import type { Episodio } from "@/types/database";
import AssistirClient from "./AssistirClient";

export default async function AssistirPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ep?: string }>;
}) {
  const { id } = await params;
  const { ep } = await searchParams;

  const supabase = await createSupabaseServerClient();

  const { data: conteudo } = await supabase
    .from("CONTEUDOS")
    .select("*")
    .eq("cd_conteudo", id)
    .maybeSingle();

  if (!conteudo) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let acesso: StatusAcesso = { liberado: false };
  let statusAcesso: "sem_login" | "negado" | "liberado";

  if (!user) {
    statusAcesso = "sem_login";
  } else {
    const idsElegiveis = await obterIdsTelegramElegiveis(user);
    acesso = await verificarAcessoConteudo(supabase, idsElegiveis, conteudo);
    statusAcesso = acesso.liberado ? "liberado" : "negado";
  }

  let episodios: Episodio[] = [];
  let episodioAtual: Episodio | null = null;

  if (conteudo.tp_formato === "SERIE") {
    const { data } = await supabase
      .from("EPISODIOS")
      .select("*")
      .eq("cd_conteudo", id)
      .order("nr_episodio", { ascending: true });

    episodios = data ?? [];

    const numeroEpisodio = ep ? Number(ep) : episodios[0]?.nr_episodio;
    episodioAtual =
      episodios.find((e) => e.nr_episodio === numeroEpisodio) ?? episodios[0] ?? null;
  }

  return (
    <AssistirClient
      conteudo={conteudo}
      episodios={episodios}
      episodioAtual={episodioAtual}
      statusAcesso={statusAcesso}
      expiraEm={acesso.liberado ? acesso.expiraEm : null}
    />
  );
}
