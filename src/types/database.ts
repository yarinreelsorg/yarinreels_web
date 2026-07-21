export type TpFormato = "FILME" | "SERIE" | "DOCUMENTARIO" | "AULA";

export type TpFontePrioritaria = "LOCAL" | "BUNNY" | "TELEGRAM";

export type TpCompra = "ALUGUEL" | "VITALICIO" | "ASSINATURA";

export type TpStatusVenda = "PENDENTE" | "APROVADA";

export type Conteudo = {
  cd_conteudo: string;
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
};

export type ConteudoInsert = {
  cd_conteudo?: string;
  nm_titulo: string;
  nm_categoria: string;
  tp_formato: TpFormato;
  dt_lancamento?: string | null;
  nm_idioma?: string | null;
  ds_descricao?: string | null;
  ds_generos?: string | null;
  ds_url_trailer_youtube?: string | null;
  nr_duracao_minutos?: number | null;
  vl_aluguel?: number | null;
  vl_vitalicio?: number | null;
  ds_url_poster?: string | null;
  ds_file_id_telegram?: string | null;
  ds_url_bunny?: string | null;
  tp_fonte_prioritaria?: TpFontePrioritaria;
  sn_destaque?: boolean;
  nr_views?: number;
};

export type ConteudoUpdate = {
  nm_titulo?: string;
  nm_categoria?: string;
  tp_formato?: TpFormato;
  dt_lancamento?: string | null;
  nm_idioma?: string | null;
  ds_descricao?: string | null;
  ds_generos?: string | null;
  ds_url_trailer_youtube?: string | null;
  nr_duracao_minutos?: number | null;
  vl_aluguel?: number | null;
  vl_vitalicio?: number | null;
  ds_url_poster?: string | null;
  ds_file_id_telegram?: string | null;
  ds_url_bunny?: string | null;
  tp_fonte_prioritaria?: TpFontePrioritaria;
  sn_destaque?: boolean;
  nr_views?: number;
};

export type Episodio = {
  cd_episodio: string;
  cd_conteudo: string;
  nr_episodio: number;
  nm_titulo: string;
  ds_file_id_telegram: string | null;
  ds_url_bunny: string | null;
};

export type Venda = {
  cd_venda: string;
  nr_id_telegram: number;
  cd_conteudo: string | null;
  cd_plano: string | null;
  tp_compra: TpCompra;
  tp_status: TpStatusVenda;
  ds_txid: string | null;
  ts_criacao: string;
  ts_atualizacao: string;
  ts_expiracao: string | null;
};

export type VendaInsert = {
  cd_venda?: string;
  nr_id_telegram: number;
  cd_conteudo?: string | null;
  cd_plano?: string | null;
  tp_compra: TpCompra;
  tp_status?: TpStatusVenda;
  ds_txid?: string | null;
  ts_expiracao?: string | null;
};

export type Plano = {
  cd_plano: string;
  nm_plano: string;
  nm_categoria: string;
  vl_plano: number;
  nr_dias_validade: number;
};

export type PlanoInsert = {
  cd_plano?: string;
  nm_plano: string;
  nm_categoria: string;
  vl_plano: number;
  nr_dias_validade: number;
};

export type PlanoUpdate = {
  nm_plano?: string;
  nm_categoria?: string;
  vl_plano?: number;
  nr_dias_validade?: number;
};

export type Ban = {
  nr_id_telegram: number;
};

export type RankingMensal = {
  cd_conteudo: string;
  nm_titulo: string;
  total_vendas: number;
};

export type TpPapelAdmin = "SUPER_ADMIN" | "ADMIN";

export type Administrador = {
  cd_administrador: string;
  nm_email: string;
  nm_nome: string;
  ds_senha_hash: string;
  tp_papel: TpPapelAdmin;
  sn_ativo: boolean;
  ts_criacao: string;
  ts_atualizacao: string;
  ts_ultimo_login: string | null;
};

export type AdministradorInsert = {
  cd_administrador?: string;
  nm_email: string;
  nm_nome: string;
  ds_senha_hash: string;
  tp_papel?: TpPapelAdmin;
  sn_ativo?: boolean;
  ts_ultimo_login?: string | null;
};

export type AdministradorUpdate = {
  nm_email?: string;
  nm_nome?: string;
  ds_senha_hash?: string;
  tp_papel?: TpPapelAdmin;
  sn_ativo?: boolean;
  ts_ultimo_login?: string | null;
};

export type Universo = {
  nm_categoria: string;
  slug: string;
  label: string;
  cor: string;
  ds_url_imagem?: string;
  nr_total_conteudos: number;
};
