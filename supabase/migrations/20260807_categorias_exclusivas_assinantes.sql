-- Categorias inteiras que só aparecem pra quem já assina (ex: um nicho tipo
-- "Gospel" que o cliente quer testar sem misturar com o catálogo principal).
alter table "CONFIGURACAO_CATEGORIAS"
  add column if not exists ds_exclusivas_assinantes text[] not null default '{}';
