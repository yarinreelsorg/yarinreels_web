import type {
  Administrador,
  AdministradorInsert,
  AdministradorUpdate,
  Ban,
  ClienteResumo,
  ComboPromocional,
  ComboPromocionalInsert,
  ComboPromocionalUpdate,
  ConfiguracaoPagamento,
  ConfiguracaoPagamentoUpdate,
  Conteudo,
  ConteudoInsert,
  ConteudoUpdate,
  Cupom,
  CupomInsert,
  CupomUpdate,
  Episodio,
  EpisodioUpdate,
  Favorito,
  FavoritoInsert,
  LogAuditoria,
  LogAuditoriaInsert,
  Plano,
  PlanoInsert,
  PlanoUpdate,
  RankingMensal,
  TentativaCartaoRecusada,
  TentativaCartaoRecusadaInsert,
  Venda,
  VendaInsert,
  VendaUpdate,
  VinculacaoTelegram,
  VinculacaoTelegramInsert,
  Visita,
  VisitaInsert,
} from "@/types/database";

export type Database = {
  public: {
    Tables: {
      ADMINISTRADORES: {
        Row: Administrador;
        Insert: AdministradorInsert;
        Update: AdministradorUpdate;
        Relationships: [];
      };
      CONTEUDOS: {
        Row: Conteudo;
        Insert: ConteudoInsert;
        Update: ConteudoUpdate;
        Relationships: [];
      };
      EPISODIOS: {
        Row: Episodio;
        Insert: Episodio;
        Update: EpisodioUpdate;
        Relationships: [];
      };
      VENDAS: {
        Row: Venda;
        Insert: VendaInsert;
        Update: VendaUpdate;
        Relationships: [];
      };
      PLANOS: {
        Row: Plano;
        Insert: PlanoInsert;
        Update: PlanoUpdate;
        Relationships: [];
      };
      BANS: {
        Row: Ban;
        Insert: Ban;
        Update: Ban;
        Relationships: [];
      };
      VINCULACOES_TELEGRAM: {
        Row: VinculacaoTelegram;
        Insert: VinculacaoTelegramInsert;
        Update: VinculacaoTelegram;
        Relationships: [];
      };
      LISTA_FAVORITOS: {
        Row: Favorito;
        Insert: FavoritoInsert;
        Update: Favorito;
        Relationships: [];
      };
      CONFIGURACAO_PAGAMENTO: {
        Row: ConfiguracaoPagamento;
        Insert: ConfiguracaoPagamento;
        Update: ConfiguracaoPagamentoUpdate;
        Relationships: [];
      };
      TENTATIVAS_CARTAO_RECUSADAS: {
        Row: TentativaCartaoRecusada;
        Insert: TentativaCartaoRecusadaInsert;
        Update: TentativaCartaoRecusadaInsert;
        Relationships: [];
      };
      LOGS_AUDITORIA: {
        Row: LogAuditoria;
        Insert: LogAuditoriaInsert;
        Update: LogAuditoriaInsert;
        Relationships: [];
      };
      VISITAS: {
        Row: Visita;
        Insert: VisitaInsert;
        Update: VisitaInsert;
        Relationships: [];
      };
      CUPONS: {
        Row: Cupom;
        Insert: CupomInsert;
        Update: CupomUpdate;
        Relationships: [];
      };
      COMBOS_PROMOCIONAIS: {
        Row: ComboPromocional;
        Insert: ComboPromocionalInsert;
        Update: ComboPromocionalUpdate;
        Relationships: [];
      };
    };
    Views: {
      vw_ranking_mensal: {
        Row: RankingMensal;
        Relationships: [];
      };
      vw_clientes: {
        Row: ClienteResumo;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
