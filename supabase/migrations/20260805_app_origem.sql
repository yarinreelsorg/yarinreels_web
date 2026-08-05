-- Campo pra marcar de qual app (ReelShort, DramaBox, etc) veio a novela,
-- usado pra filtrar o catálogo por app de origem no site.
alter table "CONTEUDOS" add column if not exists nm_app_origem text;
