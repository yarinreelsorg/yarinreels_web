-- vl_aluguel/vl_vitalicio são tratados como nullable em todo o código
-- (number | null em src/types/database.ts, formatarPreco trata null como
-- "não vendido nesse formato") mas a coluna no banco era NOT NULL — se um
-- admin limpasse um dos dois preços ao editar (ex: título que só vende
-- vitalício), o UPDATE falhava com "null value violates not-null
-- constraint" e a edição inteira era perdida, mesmo mudando só outro campo.
alter table "CONTEUDOS" alter column vl_aluguel drop not null;
alter table "CONTEUDOS" alter column vl_vitalicio drop not null;
