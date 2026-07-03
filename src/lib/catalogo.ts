export function formatarPreco(valor: number | null) {
  if (valor === null) return null;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

/**
 * Não há coluna de avaliação no schema (CONTEUDOS). Deriva uma nota
 * decorativa a partir de nr_views só para alimentar o componente de estrelas.
 */
export function calcularRating(views: number) {
  const base = 3.5 + Math.min(1.5, Math.log10(views + 1) / 4);
  return Math.round(base * 2) / 2;
}

export function isNovo(dtLancamento: string | null) {
  if (!dtLancamento) return false;
  const dias = (Date.now() - new Date(dtLancamento).getTime()) / 86400000;
  return dias >= 0 && dias <= 30;
}

export function estaExpirada(tsExpiracao: string) {
  return new Date(tsExpiracao).getTime() <= Date.now();
}

export function diasRestantes(tsExpiracao: string) {
  return Math.max(
    0,
    Math.ceil((new Date(tsExpiracao).getTime() - Date.now()) / 86400000)
  );
}
