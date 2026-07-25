-- Melhorias do painel admin: auditoria, listagem de clientes server-side e
-- upload de poster. Tudo aditivo/isolado — não toca nada usado pelo bot
-- legado.

-- Log de auditoria: quem fez o quê no painel (concessão de acesso, edição
-- de preço, exclusão de conteúdo/plano, troca de taxa de cartão, etc).
-- cd_administrador fica sem FK de propósito: se o admin for excluído no
-- futuro, o log não deve sumir nem quebrar — nm_administrador guarda o
-- nome de quem agiu no momento da ação.
create table if not exists "LOGS_AUDITORIA" (
  cd_log            uuid primary key default gen_random_uuid(),
  cd_administrador  uuid,
  nm_administrador  text not null,
  tp_acao           text not null,
  nm_entidade       text not null,
  cd_entidade       text,
  ds_detalhes       jsonb,
  ts_criacao        timestamptz not null default now()
);

create index if not exists idx_logs_auditoria_ts_criacao
  on "LOGS_AUDITORIA" (ts_criacao desc);

create index if not exists idx_logs_auditoria_entidade
  on "LOGS_AUDITORIA" (nm_entidade, cd_entidade);

-- View agregada de clientes a partir de VENDAS, pra listar/paginar/ordenar
-- no servidor em vez de agrupar tudo em memória no cliente a cada render.
-- id_telegram_texto existe só pra permitir ilike (busca parcial) — o
-- PostgREST não faz cast implícito de bigint pra texto num filtro.
create or replace view vw_clientes as
select
  nr_id_telegram,
  nr_id_telegram::text as id_telegram_texto,
  count(*)::int as total_compras,
  max(ts_criacao) as ultima_compra,
  array_agg(distinct tp_compra) as tipos_acesso
from "VENDAS"
group by nr_id_telegram;

-- Bucket de storage pra upload de poster direto do painel (em vez de exigir
-- uma URL externa já hospedada). Upload é sempre feito pelo client
-- service-role no server, então RLS de storage.objects não entra no
-- caminho — só precisa existir o bucket público pra leitura.
insert into storage.buckets (id, name, public)
values ('posters', 'posters', true)
on conflict (id) do nothing;
