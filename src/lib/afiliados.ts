import "server-only";
import { pool } from "./db";
import { obterOrigemVisitante } from "./visitas";
import { obterPercentualAfiliado } from "./site-config";

const CARACTERES_CODIGO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem 0/O/1/I, evita confusão

function gerarCodigo(tamanho = 7): string {
  let codigo = "";
  for (let i = 0; i < tamanho; i++) {
    codigo += CARACTERES_CODIGO[Math.floor(Math.random() * CARACTERES_CODIGO.length)];
  }
  return codigo;
}

/**
 * Devolve o código de indicação do usuário, gerando um na primeira vez que
 * for pedido (mesmo padrão do nr_id_telegram_web sintético em acesso.ts —
 * cria e persiste na hora, sem precisar de passo de "ativar" separado).
 */
export async function obterOuCriarCodigoAfiliado(cdUsuario: string): Promise<string> {
  const { rows } = await pool.query<{ cd_codigo_afiliado: string | null }>(
    'SELECT cd_codigo_afiliado FROM "USUARIOS" WHERE cd_usuario = $1',
    [cdUsuario]
  );
  const existente = rows[0]?.cd_codigo_afiliado;
  if (existente) return existente;

  // Colisão é extremamente improvável (33^7), mas tenta de novo se acontecer.
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const codigo = gerarCodigo();
    try {
      await pool.query('UPDATE "USUARIOS" SET cd_codigo_afiliado = $1 WHERE cd_usuario = $2', [
        codigo,
        cdUsuario,
      ]);
      return codigo;
    } catch (err) {
      if (err && typeof err === "object" && "code" in err && err.code === "23505") continue;
      throw err;
    }
  }
  throw new Error("Não foi possível gerar um código de indicação.");
}

/**
 * Chamado no cadastro: se o cookie de origem (?ref=CODIGO, já capturado
 * por VisitaTracker.tsx) bater com o código de indicação de algum usuário,
 * vincula o novo cadastro a ele permanentemente. Silencioso em qualquer
 * outro caso (origem vazia, código inexistente, auto-indicação) — nunca
 * deve travar o cadastro.
 */
export async function vincularIndicacaoNoCadastro(cdUsuarioNovo: string): Promise<void> {
  try {
    const origem = await obterOrigemVisitante();
    if (!origem || origem === "Direto / Telegram") return;

    const { rows } = await pool.query<{ cd_usuario: string }>(
      'SELECT cd_usuario FROM "USUARIOS" WHERE cd_codigo_afiliado = $1 LIMIT 1',
      [origem.trim().toUpperCase()]
    );
    const indicador = rows[0];
    if (!indicador || indicador.cd_usuario === cdUsuarioNovo) return;

    await pool.query('UPDATE "USUARIOS" SET cd_indicado_por = $1 WHERE cd_usuario = $2', [
      indicador.cd_usuario,
      cdUsuarioNovo,
    ]);
  } catch {
    // nunca deixa o cadastro falhar por causa disso
  }
}

/** Quem indicou o comprador (se houver) — usado no checkout pra creditar comissão. */
export async function obterIndicadorDoComprador(cdUsuarioComprador: string): Promise<string | null> {
  const { rows } = await pool.query<{ cd_indicado_por: string | null }>(
    'SELECT cd_indicado_por FROM "USUARIOS" WHERE cd_usuario = $1',
    [cdUsuarioComprador]
  );
  return rows[0]?.cd_indicado_por ?? null;
}

/** Comissão em R$ pro percentual atual, sobre o valor pago numa venda. */
export async function calcularComissaoAfiliado(valorPago: number): Promise<number> {
  const percentual = await obterPercentualAfiliado();
  return Math.round(valorPago * (percentual / 100) * 100) / 100;
}

export interface ResumoAfiliado {
  cd_usuario: string;
  nm_nome: string | null;
  nm_email: string;
  cd_codigo_afiliado: string | null;
  total_indicados: number;
  total_vendas_aprovadas: number;
  vl_comissao_pendente: number;
  vl_comissao_paga: number;
}

/** Lista todo mundo que já indicou pelo menos uma venda, pro admin ver e pagar. */
export async function listarResumoAfiliados(): Promise<ResumoAfiliado[]> {
  const { rows } = await pool.query<ResumoAfiliado>(`
    SELECT
      u.cd_usuario,
      u.nm_nome,
      u.nm_email,
      u.cd_codigo_afiliado,
      COUNT(DISTINCT ind.cd_usuario) AS total_indicados,
      COUNT(v.cd_venda) FILTER (WHERE v.tp_status = 'APROVADA') AS total_vendas_aprovadas,
      COALESCE(SUM(v.vl_comissao_afiliado) FILTER (WHERE v.tp_status = 'APROVADA' AND v.sn_comissao_paga = false), 0) AS vl_comissao_pendente,
      COALESCE(SUM(v.vl_comissao_afiliado) FILTER (WHERE v.tp_status = 'APROVADA' AND v.sn_comissao_paga = true), 0) AS vl_comissao_paga
    FROM "USUARIOS" u
    LEFT JOIN "USUARIOS" ind ON ind.cd_indicado_por = u.cd_usuario
    LEFT JOIN "VENDAS" v ON v.cd_afiliado_usuario = u.cd_usuario
    WHERE u.cd_indicado_por IS NOT NULL OR v.cd_venda IS NOT NULL
       OR EXISTS (SELECT 1 FROM "USUARIOS" x WHERE x.cd_indicado_por = u.cd_usuario)
    GROUP BY u.cd_usuario, u.nm_nome, u.nm_email, u.cd_codigo_afiliado
    ORDER BY vl_comissao_pendente DESC, total_vendas_aprovadas DESC
  `);
  return rows;
}

/** Resumo só do próprio usuário — pra mostrar em /conta. */
export async function obterResumoAfiliadoProprio(cdUsuario: string): Promise<{
  total_indicados: number;
  vl_comissao_pendente: number;
  vl_comissao_paga: number;
}> {
  const { rows } = await pool.query<{
    total_indicados: string;
    vl_comissao_pendente: number;
    vl_comissao_paga: number;
  }>(
    `SELECT
       (SELECT COUNT(*) FROM "USUARIOS" WHERE cd_indicado_por = $1) AS total_indicados,
       COALESCE(SUM(vl_comissao_afiliado) FILTER (WHERE tp_status = 'APROVADA' AND sn_comissao_paga = false), 0) AS vl_comissao_pendente,
       COALESCE(SUM(vl_comissao_afiliado) FILTER (WHERE tp_status = 'APROVADA' AND sn_comissao_paga = true), 0) AS vl_comissao_paga
     FROM "VENDAS" WHERE cd_afiliado_usuario = $1`,
    [cdUsuario]
  );
  const linha = rows[0];
  return {
    total_indicados: Number(linha?.total_indicados ?? 0),
    vl_comissao_pendente: linha?.vl_comissao_pendente ?? 0,
    vl_comissao_paga: linha?.vl_comissao_paga ?? 0,
  };
}

/** Marca todas as comissões pendentes de um afiliado como pagas (pagamento é manual, por fora). */
export async function marcarComissoesComoPagas(cdUsuarioAfiliado: string): Promise<void> {
  await pool.query(
    `UPDATE "VENDAS" SET sn_comissao_paga = true
     WHERE cd_afiliado_usuario = $1 AND tp_status = 'APROVADA' AND sn_comissao_paga = false`,
    [cdUsuarioAfiliado]
  );
}
