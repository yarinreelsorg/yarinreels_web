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

export function formatarViews(views: number) {
  if (views >= 1_000_000) {
    return `${(views / 1_000_000).toFixed(1).replace(".", ",")}M visualizações`;
  }
  if (views >= 1_000) {
    return `${(views / 1_000).toFixed(1).replace(".", ",")}K visualizações`;
  }
  return `${views} visualizações`;
}

export function isNovo(dtLancamento: string | null) {
  if (!dtLancamento) return false;
  const dias = (Date.now() - new Date(dtLancamento).getTime()) / 86400000;
  return dias >= 0 && dias <= 30;
}

export function estaExpirada(tsExpiracao: string) {
  return new Date(tsExpiracao).getTime() <= Date.now();
}

const BASE_URL_MEDIA_LOCAL = "https://media.melreels.com.br/filmes/";

/**
 * Resolve a URL de vídeo pra web a partir de tp_fonte_prioritaria:
 * - LOCAL: monta a URL no servidor de mídia próprio, usando o file_id do
 *   Telegram (ou o título, se não houver file_id) como nome do arquivo —
 *   adiciona ".mp4" quando o valor salvo ainda não tem extensão.
 * - BUNNY: usa ds_url_bunny direto (CDN).
 * - TELEGRAM: não existe cópia tocável na web (só o bot consegue entregar
 *   pelo file_id) — retorna null, o que faz o player cair no aviso de
 *   "disponível só pelo bot".
 */
export function resolverUrlVideo(item: {
  tp_fonte_prioritaria: "LOCAL" | "BUNNY" | "TELEGRAM";
  ds_url_bunny: string | null;
  ds_file_id_telegram: string | null;
  nm_titulo: string;
}): string | null {
  if (item.tp_fonte_prioritaria === "BUNNY") {
    return item.ds_url_bunny && item.ds_url_bunny.startsWith("http") ? item.ds_url_bunny : null;
  }

  if (item.tp_fonte_prioritaria === "LOCAL") {
    const nomeBase = (item.ds_file_id_telegram || item.nm_titulo || "").trim();
    if (!nomeBase) return null;
    const arquivo = nomeBase.toLowerCase().endsWith(".mp4") ? nomeBase : `${nomeBase}.mp4`;
    return `${BASE_URL_MEDIA_LOCAL}${encodeURIComponent(arquivo)}`;
  }

  return null;
}

export function diasRestantes(tsExpiracao: string) {
  return Math.max(
    0,
    Math.ceil((new Date(tsExpiracao).getTime() - Date.now()) / 86400000)
  );
}
