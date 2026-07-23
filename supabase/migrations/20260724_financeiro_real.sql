-- Financeiro real (não estimado): guarda o valor efetivamente cobrado em
-- cada venda feita pelo site (Pix ou cartão, já com taxa de cartão incluída
-- quando houver). Coluna nova e nullable em VENDAS — aditivo, não quebra o
-- bot legado, que continua sem preenchê-la (o admin cai no valor estimado
-- de CONTEUDOS/PLANOS pra essas linhas antigas).
alter table "VENDAS" add column if not exists vl_pago numeric(10, 2);

-- Auditoria de tentativas de cartão recusadas pela Efí — não existe no bot
-- legado (que só usa Pix), então é tabela nova e isolada, sem tocar em
-- VENDAS/tp_status pra não arriscar mexer numa constraint compartilhada.
create table if not exists "TENTATIVAS_CARTAO_RECUSADAS" (
  cd_tentativa    uuid primary key default gen_random_uuid(),
  nr_id_telegram  bigint not null,
  cd_conteudo     uuid,
  cd_plano        uuid,
  tp_compra       text not null,
  vl_tentativa    numeric(10, 2) not null,
  ds_motivo       text,
  ts_criacao      timestamptz not null default now()
);

create index if not exists idx_tentativas_cartao_recusadas_telegram
  on "TENTATIVAS_CARTAO_RECUSADAS" (nr_id_telegram);
