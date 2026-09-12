-- A FK VENDAS.cd_plano -> PLANOS.cd_plano estava como ON DELETE CASCADE:
-- excluir um plano no admin apagava em cascata TODAS as vendas que já
-- referenciaram aquele plano (histórico financeiro completo, inclusive de
-- assinantes expirados há muito tempo), não só as ativas. Achado ao
-- implementar a migração de assinantes antes da exclusão de plano —
-- exatamente o tipo de perda de dados que essa feature existe pra evitar.
--
-- Troca pra ON DELETE SET NULL: excluir um plano agora só zera a
-- referência (cd_plano vira NULL) nas vendas que ainda apontavam pra ele
-- (histórico não migrado/expirado). O registro da venda em si (quem
-- comprou, quando, quanto pagou) nunca é apagado.
alter table "VENDAS" drop constraint if exists "VENDAS_cd_plano_fkey";
alter table "VENDAS"
  add constraint "VENDAS_cd_plano_fkey"
  foreign key (cd_plano) references "PLANOS" (cd_plano) on delete set null;
