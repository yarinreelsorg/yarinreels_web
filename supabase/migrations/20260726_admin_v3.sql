-- Segunda leva de melhorias do painel admin: método de pagamento (Pix vs
-- Cartão), rastreamento de visitas/presença, cupons e combos promocionais.
-- Tudo aditivo — não altera nada que o bot legado já usa.

-- Distingue Pix de Cartão nas vendas feitas pelo site (o bot legado só usa
-- Pix e nunca preenche essa coluna, então fica null pra linhas antigas —
-- o financeiro trata null como "não identificado / feito pelo bot").
alter table "VENDAS" add column if not exists tp_metodo_pagamento text;

-- Rastreamento de visitas/presença do site público. Cada "ping" do
-- visitante (carregou uma página ou seguiu no ar) vira uma linha aqui.
-- "Online agora" = sessões com ping nos últimos minutos; "total de
-- visitas" = contagem de linhas (ou sessões distintas, pro admin decidir).
create table if not exists "VISITAS" (
  cd_visita        uuid primary key default gen_random_uuid(),
  cd_sessao        text not null,
  nr_id_telegram   bigint,
  ds_pagina        text,
  ds_ip            text,
  ds_dispositivo   text,
  ts_criacao       timestamptz not null default now()
);

create index if not exists idx_visitas_ts_criacao on "VISITAS" (ts_criacao desc);
create index if not exists idx_visitas_sessao on "VISITAS" (cd_sessao);
create index if not exists idx_visitas_telegram on "VISITAS" (nr_id_telegram);

-- Cupons de desconto — gerenciados pelo admin. Aplicação no checkout fica
-- fora deste escopo (só a gestão/CRUD no painel).
create table if not exists "CUPONS" (
  cd_cupom        uuid primary key default gen_random_uuid(),
  cd_codigo       text not null unique,
  tp_desconto     text not null check (tp_desconto in ('PERCENTUAL', 'FIXO')),
  vl_desconto     numeric(10, 2) not null,
  nr_usos_maximo  int,
  nr_usos_atual   int not null default 0,
  dt_validade     date,
  sn_ativo        boolean not null default true,
  ts_criacao      timestamptz not null default now()
);

-- Combos promocionais — pacotes de conteúdos vendidos por um preço único.
-- Aplicação no checkout fica fora deste escopo (só a gestão/CRUD no painel).
create table if not exists "COMBOS_PROMOCIONAIS" (
  cd_combo      uuid primary key default gen_random_uuid(),
  nm_combo      text not null,
  cd_conteudos  uuid[] not null default '{}',
  vl_combo      numeric(10, 2) not null,
  sn_ativo      boolean not null default true,
  ts_criacao    timestamptz not null default now()
);
