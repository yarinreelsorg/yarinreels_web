import type { Ban, Conteudo, Episodio, Plano, Venda } from "@/types/database";

export interface Database {
  public: {
    Tables: {
      CONTEUDOS: {
        Row: Conteudo;
        Insert: Partial<Conteudo>;
        Update: Partial<Conteudo>;
      };
      EPISODIOS: {
        Row: Episodio;
        Insert: Partial<Episodio>;
        Update: Partial<Episodio>;
      };
      VENDAS: {
        Row: Venda;
        Insert: Partial<Venda>;
        Update: Partial<Venda>;
      };
      PLANOS: {
        Row: Plano;
        Insert: Partial<Plano>;
        Update: Partial<Plano>;
      };
      BANS: {
        Row: Ban;
        Insert: Partial<Ban>;
        Update: Partial<Ban>;
      };
    };
  };
}
