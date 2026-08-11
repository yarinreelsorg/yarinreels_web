-- Migration idempotente para suporte a níveis de banimento e rastreamento de origem de vendas por Telegram/Canal

ALTER TABLE "BANS" ADD COLUMN IF NOT EXISTS tp_banimento text DEFAULT 'TOTAL';
ALTER TABLE "BANS" ADD COLUMN IF NOT EXISTS ds_acoes_bloqueadas text[] DEFAULT '{}';
ALTER TABLE "BANS" ADD COLUMN IF NOT EXISTS ds_motivo text;
ALTER TABLE "BANS" ADD COLUMN IF NOT EXISTS ds_mensagem_bloqueio text;
ALTER TABLE "BANS" ADD COLUMN IF NOT EXISTS ts_criacao timestamp with time zone DEFAULT now();

ALTER TABLE "VENDAS" ADD COLUMN IF NOT EXISTS ds_origem text DEFAULT 'Direto / Telegram';
