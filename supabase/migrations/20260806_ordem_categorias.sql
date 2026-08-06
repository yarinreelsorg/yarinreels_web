-- Ordem customizada das categorias na home/catálogo, editável pelo admin.
create table if not exists "CONFIGURACAO_CATEGORIAS" (
  cd_configuracao  uuid primary key default gen_random_uuid(),
  ds_ordem         text[] not null default '{}'
);
