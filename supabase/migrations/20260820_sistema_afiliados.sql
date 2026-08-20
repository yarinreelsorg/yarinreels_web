-- Sistema de indicação: cada usuário logado tem um código próprio
-- (cd_codigo_afiliado); quem se cadastra vindo de um link com ?ref=CODIGO
-- fica permanentemente vinculado a esse indicador (cd_indicado_por).
-- Reaproveita o mecanismo de cookie que já existe pra "Origem Telegram"
-- (visitor_origem, capturado em VisitaTracker.tsx via ?ref=) — o valor
-- salvo lá é comparado contra cd_codigo_afiliado na hora do cadastro.
alter table "USUARIOS" add column if not exists cd_codigo_afiliado text unique;
alter table "USUARIOS" add column if not exists cd_indicado_por uuid references "USUARIOS" (cd_usuario);

-- Percentual de comissão, configurável pelo admin (Configurações).
alter table "CONFIGURACAO_SITE" add column if not exists vl_percentual_afiliado numeric not null default 10;

-- Snapshot da comissão em cada venda: guarda o valor calculado (não só o
-- percentual) pra não recalcular errado se o percentual mudar depois.
-- sn_comissao_paga é marcado manualmente pelo admin (pagamento é por fora,
-- Pix direto pro afiliado — sem gateway de payout automático por enquanto).
alter table "VENDAS" add column if not exists cd_afiliado_usuario uuid references "USUARIOS" (cd_usuario);
alter table "VENDAS" add column if not exists vl_comissao_afiliado numeric;
alter table "VENDAS" add column if not exists sn_comissao_paga boolean not null default false;
