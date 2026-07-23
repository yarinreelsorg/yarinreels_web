-- Taxa fixa adicional cobrada em pagamentos com cartão (CLAUDE.md: "Cartão:
-- taxa adicional fixa configurável sobre o valor"). Linha única, editável
-- pelo admin. Não existe no schema do bot legado — tabela nova, isolada.

create table if not exists "CONFIGURACAO_PAGAMENTO" (
  cd_configuracao  uuid primary key default gen_random_uuid(),
  vl_taxa_cartao   numeric(10, 2) not null default 0,
  ts_atualizacao   timestamptz not null default now()
);

insert into "CONFIGURACAO_PAGAMENTO" (vl_taxa_cartao)
select 0
where not exists (select 1 from "CONFIGURACAO_PAGAMENTO");
