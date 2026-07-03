export type TpFormato = "FILME" | "SERIE" | "DOCUMENTARIO" | "AULA";

export type TpFontePrioritaria = "LOCAL" | "BUNNY" | "TELEGRAM";

export type TpCompra = "ALUGUEL" | "VITALICIO" | "ASSINATURA";

export type TpStatusVenda = "PENDENTE" | "APROVADA";

export interface Conteudo {
  cd_conteudo: number;
  nm_titulo: string;
  nm_categoria: string;
  tp_formato: TpFormato;
  dt_lancamento: string | null;
  nm_idioma: string | null;
  ds_descricao: string | null;
  ds_generos: string | null;
  ds_url_trailer_youtube: string | null;
  nr_duracao_minutos: number | null;
  vl_aluguel: number | null;
  vl_vitalicio: number | null;
  ds_url_poster: string | null;
  ds_file_id_telegram: string | null;
  ds_url_bunny: string | null;
  tp_fonte_prioritaria: TpFontePrioritaria;
  sn_destaque: boolean;
  nr_views: number;
}

export interface Episodio {
  cd_episodio: number;
  cd_conteudo: number;
  nr_episodio: number;
  nm_titulo: string;
  ds_file_id_telegram: string | null;
  ds_url_bunny: string | null;
}

export interface Venda {
  cd_venda: number;
  nr_id_telegram: number;
  cd_conteudo: number;
  cd_plano: number | null;
  tp_compra: TpCompra;
  tp_status: TpStatusVenda;
  ds_txid: string | null;
  ts_criacao: string;
  ts_atualizacao: string;
  ts_expiracao: string;
}

export interface Plano {
  cd_plano: number;
  nm_plano: string;
  nm_categoria: string;
  nr_dias_validade: number;
}

export interface Ban {
  nr_id_telegram: number;
}
