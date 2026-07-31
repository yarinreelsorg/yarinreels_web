-- tp_compra é um ENUM do Postgres (type_modalidade_compra), não texto puro.
-- array_agg(distinct tp_compra) produzia um array desse tipo enum, que o
-- driver `pg` não sabe desserializar automaticamente (só tem parser nativo
-- pra arrays de tipos builtin como text[]/int[]) — chegava no app como a
-- string literal "{ALUGUEL}" em vez de um array de verdade, quebrando
-- tipos_acesso.map(). Faz o cast pra text antes de agregar, assim o
-- resultado vira um text[] normal.
-- create or replace não deixa trocar o tipo de uma coluna existente da
-- view (type_modalidade_compra[] -> text[]), então recria do zero.
drop view if exists vw_clientes;

create view vw_clientes as
select
  nr_id_telegram,
  nr_id_telegram::text as id_telegram_texto,
  count(*)::int as total_compras,
  max(ts_criacao) as ultima_compra,
  array_agg(distinct tp_compra::text) as tipos_acesso
from "VENDAS"
group by nr_id_telegram;
