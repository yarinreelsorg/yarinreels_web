-- Permite ao admin escolher manualmente (e ordenar) o que aparece no
-- Carrossel de Destaque (Hero) e no Top 12 da home, em vez de depender só
-- de nr_views. sn_destaque já existia (era usado só como toggle sem ordem);
-- nr_ordem_destaque adiciona controle de posição. sn_top12/nr_ordem_top12
-- são novos.
alter table "CONTEUDOS" add column if not exists nr_ordem_destaque integer;
alter table "CONTEUDOS" add column if not exists sn_top12 boolean not null default false;
alter table "CONTEUDOS" add column if not exists nr_ordem_top12 integer;
