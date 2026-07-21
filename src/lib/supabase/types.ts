import type {
  Administrador,
  AdministradorInsert,
  AdministradorUpdate,
  Ban,
  Conteudo,
  ConteudoInsert,
  ConteudoUpdate,
  Episodio,
  Favorito,
  FavoritoInsert,
  Plano,
  PlanoInsert,
  PlanoUpdate,
  RankingMensal,
  Venda,
  VendaInsert,
  VinculacaoTelegram,
  VinculacaoTelegramInsert,
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
        Update: Episodio;
        Relationships: [];
      };
      VENDAS: {
        Row: Venda;
        Insert: VendaInsert;
        Update: Venda;
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
    };
    Views: {
      vw_ranking_mensal: {
        Row: RankingMensal;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
