-- Carência de lançamento passa a ser opt-in por título, em vez de valer
-- automaticamente pra tudo que for cadastrado enquanto o valor global
-- (CONFIGURACAO_SITE.nr_horas_carencia_assinante) estiver setado. Sem isso,
-- toda vez que catálogo antigo era importado a carência disparava sem querer.
alter table "CONTEUDOS" add column if not exists sn_carencia_ativa boolean not null default false;
