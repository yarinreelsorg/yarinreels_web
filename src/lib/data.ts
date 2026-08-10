/**
 * Formata data/hora sempre no fuso de Brasília — sem isso, formatação
 * feita em Server Component roda no fuso do servidor (UTC na Vercel),
 * aparecendo ~3h adiantada pra quem está no Brasil.
 */
export function formatarDataHora(
  data: Date | string,
  opcoes: Intl.DateTimeFormatOptions = {}
): string {
  const dataObj = typeof data === "string" ? new Date(data) : data;
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    ...opcoes,
  }).format(dataObj);
}

/**
 * Chave "YYYY-MM-DD" do dia calendário em Brasília — usa isso pra
 * agrupar/comparar "mesmo dia" em vez de getFullYear()/getMonth()/getDate(),
 * que leem o fuso do runtime (UTC na Vercel) e erram o dia perto da
 * meia-noite.
 */
export function chaveDiaBrasil(data: Date | string): string {
  const dataObj = typeof data === "string" ? new Date(data) : data;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(dataObj);
}
