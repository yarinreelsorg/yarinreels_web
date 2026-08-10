/**
 * Formata data/hora sempre no fuso de Brasília — sem isso, formatação
 * feita em Server Component roda no fuso do servidor (UTC na Vercel),
 * aparecendo ~3h adiantada pra quem está no Brasil.
 *
 * `Intl.DateTimeFormat` é caro de instanciar (carrega dados de locale/ICU) —
 * cacheia uma instância por combinação de opções em vez de criar uma nova a
 * cada chamada, senão um loop com centenas de chamadas (ex: bucketing de
 * vendas por dia) explode memória/CPU e derruba a function por OOM.
 */
const cacheFormatadoresDataHora = new Map<string, Intl.DateTimeFormat>();

export function formatarDataHora(
  data: Date | string,
  opcoes: Intl.DateTimeFormatOptions = {}
): string {
  const dataObj = typeof data === "string" ? new Date(data) : data;
  const chave = JSON.stringify(opcoes);
  let formatador = cacheFormatadoresDataHora.get(chave);
  if (!formatador) {
    formatador = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", ...opcoes });
    cacheFormatadoresDataHora.set(chave, formatador);
  }
  return formatador.format(dataObj);
}

/**
 * Chave "YYYY-MM-DD" do dia calendário em Brasília — usa isso pra
 * agrupar/comparar "mesmo dia" em vez de getFullYear()/getMonth()/getDate(),
 * que leem o fuso do runtime (UTC na Vercel) e erram o dia perto da
 * meia-noite.
 */
const formatadorChaveDia = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function chaveDiaBrasil(data: Date | string): string {
  const dataObj = typeof data === "string" ? new Date(data) : data;
  return formatadorChaveDia.format(dataObj);
}
