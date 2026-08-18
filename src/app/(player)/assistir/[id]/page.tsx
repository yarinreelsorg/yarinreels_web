import { notFound } from "next/navigation";
import { pool } from "@/lib/db";
import { getSessaoUsuario } from "@/lib/user-auth";
import { obterIdsTelegramElegiveis, verificarAcessoConteudo, type StatusAcesso } from "@/lib/acesso";
import { obterCarenciaAssinanteHoras } from "@/lib/site-config";
import type { Conteudo, Episodio } from "@/types/database";
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

  const { rows: conteudos } = await pool.query<Conteudo>(
    'SELECT * FROM "CONTEUDOS" WHERE cd_conteudo = $1 LIMIT 1',
    [id]
  );
  const conteudo = conteudos[0];

  if (!conteudo) notFound();

  // Incrementa visualizações em segundo plano ao assistir
  pool.query('UPDATE "CONTEUDOS" SET nr_views = nr_views + 1 WHERE cd_conteudo = $1', [conteudo.cd_conteudo]).catch(() => {});

  const sessao = await getSessaoUsuario();

  let acesso: StatusAcesso = { liberado: false };
  let statusAcesso: "sem_login" | "negado" | "liberado";

  if (!sessao) {
    statusAcesso = "sem_login";
  } else {
    const [idsElegiveis, carenciaHoras] = await Promise.all([
      obterIdsTelegramElegiveis(sessao.cd_usuario),
      obterCarenciaAssinanteHoras(),
    ]);
    acesso = await verificarAcessoConteudo(idsElegiveis, conteudo, carenciaHoras);
    statusAcesso = acesso.liberado ? "liberado" : "negado";
  }

  let episodios: Episodio[] = [];
  let episodioAtual: Episodio | null = null;

  if (conteudo.tp_formato === "SERIE") {
    const { rows } = await pool.query<Episodio>(
      'SELECT * FROM "EPISODIOS" WHERE cd_conteudo = $1 ORDER BY nr_episodio ASC',
      [id]
    );

    episodios = rows;

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
      emCarencia={!acesso.liberado && !!acesso.emCarencia}
    />
  );
}
