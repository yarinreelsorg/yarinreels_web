import type {
  Administrador,
  AdministradorInsert,
  AdministradorUpdate,
  Ban,
  Conteudo,
  ConteudoInsert,
  ConteudoUpdate,
  Episodio,
  Plano,
  PlanoInsert,
  PlanoUpdate,
  RankingMensal,
  Venda,
  VendaInsert,
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
