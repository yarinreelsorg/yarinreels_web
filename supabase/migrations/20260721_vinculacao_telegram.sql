-- Vinculação entre conta web (Supabase Auth) e nr_id_telegram do bot legado.
-- O código é gerado pelo site e confirmado pelo BOT (fora deste repositório)
-- quando o cliente manda o código pra ele no Telegram — o site nunca marca
-- a própria vinculação como confirmada, só o bot (via service_role) pode.

create table if not exists "VINCULACOES_TELEGRAM" (
  cd_vinculacao    uuid primary key default gen_random_uuid(),
  cd_usuario_auth  uuid not null references auth.users(id) on delete cascade,
  cd_codigo        text not null unique,
  nr_id_telegram   bigint,
  tp_status        text not null default 'PENDENTE' check (tp_status in ('PENDENTE', 'CONFIRMADO')),
  ts_criacao       timestamptz not null default now(),
  ts_confirmacao   timestamptz,
  ts_expiracao     timestamptz not null default (now() + interval '15 minutes')
);

create index if not exists idx_vinculacoes_telegram_usuario
  on "VINCULACOES_TELEGRAM" (cd_usuario_auth);

create index if not exists idx_vinculacoes_telegram_codigo
  on "VINCULACOES_TELEGRAM" (cd_codigo);

alter table "VINCULACOES_TELEGRAM" enable row level security;

-- O usuário autenticado pode criar e ler os próprios códigos...
create policy "Usuário cria seus próprios códigos"
  on "VINCULACOES_TELEGRAM"
  for insert
  with check (auth.uid() = cd_usuario_auth);

create policy "Usuário vê seus próprios códigos"
  on "VINCULACOES_TELEGRAM"
  for select
  using (auth.uid() = cd_usuario_auth);

create policy "Usuário remove seus próprios códigos"
  on "VINCULACOES_TELEGRAM"
  for delete
  using (auth.uid() = cd_usuario_auth);

-- ...mas NUNCA pode confirmar a própria vinculação (isso evita o usuário
-- simplesmente marcar tp_status = 'CONFIRMADO' com um nr_id_telegram
-- qualquer pelo client). Só o bot, com a service_role key (que ignora RLS),
-- pode fazer esse update. Não existe policy de UPDATE pra authenticated.
