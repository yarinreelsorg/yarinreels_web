-- Progresso de visualização por usuário do site, pra alimentar a seção
-- "Continuar assistindo" na home. Uma linha por (usuário, conteúdo),
-- sobrescrita a cada atualização de progresso.
create table if not exists "HISTORICO_VISUALIZACAO" (
  cd_historico       uuid primary key default gen_random_uuid(),
  cd_usuario         uuid not null references "USUARIOS" (cd_usuario) on delete cascade,
  cd_conteudo        uuid not null references "CONTEUDOS" (cd_conteudo) on delete cascade,
  nr_segundo_atual   integer not null default 0,
  nr_duracao_total   integer,
  sn_concluido       boolean not null default false,
  ts_atualizacao     timestamptz not null default now(),
  unique (cd_usuario, cd_conteudo)
);

create index if not exists idx_historico_visualizacao_usuario
  on "HISTORICO_VISUALIZACAO" (cd_usuario, ts_atualizacao desc);
