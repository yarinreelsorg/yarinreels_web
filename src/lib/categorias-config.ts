import "server-only";
import { pool } from "./db";

function normalizar(categoria: string) {
  return categoria
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

const GRUPO_AMERICANA = ["americana", "americano", "americanas", "americanos"];
const GRUPO_BRASILEIRA = ["brasileira", "brasileiro", "brasileiras", "brasileiros"];
const GRUPO_ADULTO = ["+18", "18", "mais de 18", "mais de 18 anos", "adulto"];

/**
 * Ordem padrão quando o admin ainda não configurou nada: 1º Americanas,
 * 2º Brasileiras, 3º +18, e o resto em ordem alfabética depois disso.
 */
function rankPadrao(categoria: string): number {
  const norm = normalizar(categoria);
  if (GRUPO_AMERICANA.includes(norm)) return 0;
  if (GRUPO_BRASILEIRA.includes(norm)) return 1;
  if (GRUPO_ADULTO.includes(norm)) return 2;
  return 3;
}

export function ordenarCategoriasPadrao(categorias: string[]): string[] {
  return [...categorias].sort((a, b) => {
    const diff = rankPadrao(a) - rankPadrao(b);
    if (diff !== 0) return diff;
    return a.localeCompare(b, "pt-BR");
  });
}

async function obterConfigSalva() {
  const { rows } = await pool.query<{
    ds_ordem: string[];
    ds_ocultas: string[];
    ds_exclusivas_assinantes: string[];
  }>('SELECT ds_ordem, ds_ocultas, ds_exclusivas_assinantes FROM "CONFIGURACAO_CATEGORIAS" LIMIT 1');
  return {
    ordem: rows[0]?.ds_ordem ?? [],
    ocultas: rows[0]?.ds_ocultas ?? [],
    exclusivas: rows[0]?.ds_exclusivas_assinantes ?? [],
  };
}

/** Nomes de categoria marcadas como exclusivas de assinante — pra filtrar
 * o conteúdo delas fora de destaques/Top12/carrosséis pra quem não assina. */
export async function obterCategoriasExclusivasAssinantes(): Promise<string[]> {
  const { exclusivas } = await obterConfigSalva();
  return exclusivas;
}

/** Busca a ordem salva pelo admin (se houver) e aplica, removendo as
 * ocultas e as exclusivas de assinante (se o visitante não for assinante);
 * categorias novas que não estão na lista salva entram depois, na ordem
 * padrão. */
export async function ordenarCategorias(
  categorias: string[],
  ehAssinante = false
): Promise<string[]> {
  const { ordem: ordemSalva, ocultas, exclusivas } = await obterConfigSalva();
  const visiveis = categorias.filter(
    (c) => !ocultas.includes(c) && (ehAssinante || !exclusivas.includes(c))
  );

  if (ordemSalva.length === 0) {
    return ordenarCategoriasPadrao(visiveis);
  }

  const presentes = new Set(visiveis);
  const ordenadas = ordemSalva.filter((c) => presentes.has(c));
  const restantes = ordenarCategoriasPadrao(
    visiveis.filter((c) => !ordemSalva.includes(c))
  );

  return [...ordenadas, ...restantes];
}

/** Todas as categorias (visíveis e ocultas) já na ordem certa, pra tela
 * de administração — inclui as ocultas no fim, marcadas. */
export async function ordenarCategoriasParaAdmin(categorias: string[]): Promise<
  { nm_categoria: string; visivel: boolean; exclusivaAssinantes: boolean }[]
> {
  const { ordem: ordemSalva, ocultas, exclusivas } = await obterConfigSalva();
  const visiveis = categorias.filter((c) => !ocultas.includes(c));
  const ordenadasVisiveis =
    ordemSalva.length === 0
      ? ordenarCategoriasPadrao(visiveis)
      : [
          ...ordemSalva.filter((c) => visiveis.includes(c)),
          ...ordenarCategoriasPadrao(visiveis.filter((c) => !ordemSalva.includes(c))),
        ];

  const ocultasPresentes = categorias.filter((c) => ocultas.includes(c));

  const paraObjeto = (visivel: boolean) => (c: string) => ({
    nm_categoria: c,
    visivel,
    exclusivaAssinantes: exclusivas.includes(c),
  });

  return [...ordenadasVisiveis.map(paraObjeto(true)), ...ocultasPresentes.map(paraObjeto(false))];
}

/** Renomeia uma categoria em todo o catálogo (e nos planos de assinatura
 * que a referenciam), preservando a posição salva na ordem/ocultas/exclusivas. */
export async function renomearCategoria(nomeAntigo: string, nomeNovo: string) {
  await pool.query('UPDATE "CONTEUDOS" SET nm_categoria = $1 WHERE nm_categoria = $2', [
    nomeNovo,
    nomeAntigo,
  ]);
  await pool.query('UPDATE "PLANOS" SET nm_categoria = $1 WHERE nm_categoria = $2', [
    nomeNovo,
    nomeAntigo,
  ]);

  const { ordem, ocultas, exclusivas } = await obterConfigSalva();
  const substituir = (lista: string[]) =>
    lista.map((c) => (c === nomeAntigo ? nomeNovo : c));

  await salvarConfigCategorias(substituir(ordem), substituir(ocultas), substituir(exclusivas));
}

/** Salva ordem + categorias ocultas + exclusivas de assinante — cria a
 * linha de config se ainda não existir. */
export async function salvarConfigCategorias(
  ordem: string[],
  ocultas: string[],
  exclusivas: string[] = []
) {
  const { rows: existente } = await pool.query<{ cd_configuracao: string }>(
    'SELECT cd_configuracao FROM "CONFIGURACAO_CATEGORIAS" LIMIT 1'
  );

  if (existente[0]) {
    await pool.query(
      'UPDATE "CONFIGURACAO_CATEGORIAS" SET ds_ordem = $1, ds_ocultas = $2, ds_exclusivas_assinantes = $3 WHERE cd_configuracao = $4',
      [ordem, ocultas, exclusivas, existente[0].cd_configuracao]
    );
  } else {
    await pool.query(
      'INSERT INTO "CONFIGURACAO_CATEGORIAS" (ds_ordem, ds_ocultas, ds_exclusivas_assinantes) VALUES ($1, $2, $3)',
      [ordem, ocultas, exclusivas]
    );
  }
}
