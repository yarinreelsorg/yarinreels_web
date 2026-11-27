-- Black Friday: desconto percentual global aplicado direto nos preços de
-- CONTEUDOS (e, opcionalmente, PLANOS). Os preços são sobrescritos de verdade
-- — e não só "calculados na tela" — porque o bot Telegram legado lê
-- vl_aluguel/vl_vitalicio/vl_plano direto do banco, então só assim ele
-- vende com o mesmo desconto que o site.
--
-- As colunas *_original guardam o preço de antes da promoção: é delas que o
-- desconto é recalculado (trocar 20% por 30% não acumula) e é pra elas que
-- os preços voltam quando a promoção termina. NULL = sem promoção aplicada.
-- Só colunas novas e nullable — o bot continua lendo/escrevendo igual.
alter table "CONTEUDOS"
  add column if not exists vl_aluguel_original numeric,
  add column if not exists vl_vitalicio_original numeric;

alter table "PLANOS"
  add column if not exists vl_plano_original numeric;

-- Estado da promoção ativa (nr_percentual_black_friday NULL = nenhuma).
alter table "CONFIGURACAO_SITE"
  add column if not exists nr_percentual_black_friday integer,
  add column if not exists sn_black_friday_planos boolean not null default false,
  add column if not exists ts_black_friday_inicio timestamptz;
