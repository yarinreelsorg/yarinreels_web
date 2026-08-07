-- Conteúdos de nicho que só devem aparecer pra quem já assina (não poluem
-- a home nem o catálogo geral pra quem não é assinante).
alter table "CONTEUDOS" add column if not exists sn_exclusivo_assinantes boolean not null default false;
