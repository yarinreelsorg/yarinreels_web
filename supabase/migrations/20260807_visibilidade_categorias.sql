-- Categorias ocultas (não aparecem em chips/carrosséis/filtros, mas o
-- conteúdo continua existindo e comprável por link direto).
alter table "CONFIGURACAO_CATEGORIAS" add column if not exists ds_ocultas text[] not null default '{}';
