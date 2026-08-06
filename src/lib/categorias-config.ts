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
 * Ordem padrão quando o admin ainda não configurou nada: Americanas e
 * Brasileiras primeiro (conteúdo principal da plataforma), o resto em
 * ordem alfabética, e "+18" só depois de tudo isso — não é o carro-chefe.
 */
function rankPadrao(categoria: string): number {
  const norm = normalizar(categoria);
  if (GRUPO_AMERICANA.includes(norm)) return 0;
  if (GRUPO_BRASILEIRA.includes(norm)) return 1;
  if (GRUPO_ADULTO.includes(norm)) return 3;
  return 2;
}

export function ordenarCategoriasPadrao(categorias: string[]): string[] {
  return [...categorias].sort((a, b) => {
    const diff = rankPadrao(a) - rankPadrao(b);
    if (diff !== 0) return diff;
    return a.localeCompare(b, "pt-BR");
  });
}

/** Busca a ordem salva pelo admin (se houver) e aplica; categorias novas
 * que não estão na lista salva entram depois, na ordem padrão. */
export async function ordenarCategorias(categorias: string[]): Promise<string[]> {
  const { rows } = await pool.query<{ ds_ordem: string[] }>(
    'SELECT ds_ordem FROM "CONFIGURACAO_CATEGORIAS" LIMIT 1'
  );
  const ordemSalva = rows[0]?.ds_ordem ?? [];

  if (ordemSalva.length === 0) {
    return ordenarCategoriasPadrao(categorias);
  }

  const presentes = new Set(categorias);
  const ordenadas = ordemSalva.filter((c) => presentes.has(c));
  const restantes = ordenarCategoriasPadrao(
    categorias.filter((c) => !ordemSalva.includes(c))
  );

  return [...ordenadas, ...restantes];
}
