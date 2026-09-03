/**
 * Todos os pôsteres do catálogo vêm do CDN do Blogger
 * (blogger.googleusercontent.com), que aceita redimensionar a imagem via
 * sufixo "=wNNN" na própria URL — sem isso, cards de ~230px de largura
 * carregavam o JPEG original (frequentemente 600-900KB), pesando o site
 * inteiro à toa. Com o sufixo, a mesma imagem cai pra ~30-50KB.
 * Outros hosts (Bunny, upload local futuro) não suportam o parâmetro,
 * então só aplica quando a URL é reconhecidamente do Google.
 */
export function otimizarUrlPoster(url: string | null, largura: number): string | null {
  if (!url) return null;
  try {
    const { hostname } = new URL(url);
    if (!hostname.endsWith("googleusercontent.com")) return url;
  } catch {
    return url;
  }
  // Remove um sufixo "=wNNN..." que já exista antes de acrescentar o novo.
  const base = url.replace(/=w\d+.*$/, "");
  return `${base}=w${largura}`;
}

/** Minúsculo, sem acento, sem pontuação — só letras/números separados por
 * um espaço só. */
function normalizarBusca(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Busca de título tolerante: ignora maiúscula/minúscula, acento e
 * pontuação (vírgula, dois-pontos etc — comuns em título tipo "A Traição
 * da Noiva, O Inferno de Dante"), e não exige que as palavras apareçam
 * na ordem exata — cada palavra digitada só precisa aparecer em algum
 * lugar do título. Um simples `.includes()` cru falhava toda vez que o
 * cliente esquecia a vírgula, digitava sem acento, ou trocava a ordem
 * das palavras.
 */
export function tituloCorrespondeABusca(titulo: string, busca: string): boolean {
  const buscaNormalizada = normalizarBusca(busca);
  if (!buscaNormalizada) return true;

  const tituloNormalizado = normalizarBusca(titulo);
  const palavras = buscaNormalizada.split(" ").filter(Boolean);
  return palavras.every((palavra) => tituloNormalizado.includes(palavra));
}

export function formatarPreco(valor: number | null) {
  if (valor === null || valor <= 0) return null;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

/**
  * Retorna o preço principal a ser exibido na capa/card do conteúdo:
  * Prioriza o valor de aluguel se for válido (>0). Se nulo ou zerado,
  * busca o valor do plano vitalício.
  */
export function obterPrecoCapa(conteudo: {
  vl_aluguel?: number | null;
  vl_vitalicio?: number | null;
}): number | null {
  if (typeof conteudo.vl_aluguel === "number" && conteudo.vl_aluguel > 0) {
    return conteudo.vl_aluguel;
  }
  if (typeof conteudo.vl_vitalicio === "number" && conteudo.vl_vitalicio > 0) {
    return conteudo.vl_vitalicio;
  }
  return null;
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
export type TrilhaAudio = "dublado" | "legendado";

export function resolverUrlVideo(
  item: {
    tp_fonte_prioritaria: string;
    ds_url_bunny: string | null;
    ds_file_id_telegram: string | null;
    ds_url_bunny_legendado?: string | null;
    ds_file_id_telegram_legendado?: string | null;
    nm_titulo: string;
  },
  trilha: TrilhaAudio = "dublado"
): string | null {
  // Dado legado do bot grava esse campo com casing inconsistente
  // ("LOCAL", "local", etc) — normaliza antes de comparar.
  const fonte = (item.tp_fonte_prioritaria || "").toUpperCase();

  // Faixa legendada é opcional — se não foi cadastrada pra esse item, cai
  // de volta pra faixa padrão (dublado) em vez de quebrar a reprodução.
  const urlBunny =
    (trilha === "legendado" ? item.ds_url_bunny_legendado : null) || item.ds_url_bunny;
  const fileIdTelegram =
    (trilha === "legendado" ? item.ds_file_id_telegram_legendado : null) ||
    item.ds_file_id_telegram;

  if (fonte === "BUNNY") {
    return urlBunny && urlBunny.startsWith("http") ? urlBunny : null;
  }

  if (fonte === "LOCAL") {
    const nomeBase = (fileIdTelegram || item.nm_titulo || "").trim();
    if (!nomeBase) return null;
    const arquivo = nomeBase.toLowerCase().endsWith(".mp4") ? nomeBase : `${nomeBase}.mp4`;
    return `${BASE_URL_MEDIA_LOCAL}${encodeURIComponent(arquivo)}`;
  }

  return null;
}

/** Uma faixa legendada só existe de verdade se tiver um valor DIFERENTE do
 * dublado — value idêntico normalmente significa que ninguém cadastrou a
 * versão legendada ainda. */
export function temTrilhaLegendada(item: {
  tp_fonte_prioritaria: string;
  ds_url_bunny_legendado?: string | null;
  ds_file_id_telegram_legendado?: string | null;
}): boolean {
  const fonte = (item.tp_fonte_prioritaria || "").toUpperCase();
  if (fonte === "BUNNY") return !!item.ds_url_bunny_legendado?.trim();
  if (fonte === "LOCAL") return !!item.ds_file_id_telegram_legendado?.trim();
  return false;
}

export function diasRestantes(tsExpiracao: string) {
  return Math.max(
    0,
    Math.ceil((new Date(tsExpiracao).getTime() - Date.now()) / 86400000)
  );
}
