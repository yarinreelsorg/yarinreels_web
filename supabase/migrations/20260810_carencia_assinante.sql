-- Janela de carência: lançamentos recentes ficam bloqueados pra quem só
-- tem assinatura (não avulsa) por N horas, pra evitar que assinante grave e
-- pirateie no dia do lançamento, e pra dar tempo de vender avulso antes.
-- 0 = carência desativada (comportamento atual, acesso instantâneo).
alter table "CONFIGURACAO_SITE"
  add column if not exists nr_horas_carencia_assinante integer not null default 0;
