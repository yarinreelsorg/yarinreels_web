-- Apps de origem (ReelShort, DramaBox etc.) gerenciados pelo admin — nome,
-- ícone e ordem editáveis, em vez de derivados automaticamente do que foi
-- digitado em cada conteúdo.
create table if not exists "APPS_NAVEGACAO" (
  cd_app       uuid primary key default gen_random_uuid(),
  nm_app       text not null unique,
  ds_icone     text not null default '▶️',
  nr_ordem     integer not null default 0,
  sn_visivel   boolean not null default true,
  ts_criacao   timestamptz not null default now()
);
